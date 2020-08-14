'use strict'

const {Command} = require('@adonisjs/ace')
const sleep = require('sleep');
const axios = require("axios")
const cheerio = require("cheerio")
const Database = use('Database')
const file = require('fs')
const norm = require('normalize-url')
const Event = use('App/Models/Event')
const Band = use('App/Models/Band')
const BandEvent = use('App/Models/BandEvent')
const Env = use('Env')

const SDR_ROOT = 'https://www.sandiegoreader.com/'

class Scrape extends Command {
  static get signature(){
    return 'scrape'
  }

  static get description(){
    return 'LNO scraper. Scrape from SDR, bandmix, etc..' +
      '08/02: scrape SDR for now'
  }

  async handle(){
    // const LIMIT = 1
    const LIMIT = 150
    let node_env = Env.get('NODE_ENV')
    /** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */

      // /** @type {typeof import('@adonisjs/lucid/src/Database')} */
    const EVENT_DB = Database.table('event as e')
    const EVENT_QUERY = Database.table('event as e')
    let all_evs_wo_band_qb = await Event.query().select('e.id AS id', 'e.source', 'e.website', 'e.band_urls', 'be.id AS bandevid', 'e.sdr_name')
      .from('event as e').leftOuterJoin('band_event as be', 'e.id', 'event_id')
      .where('source', 'sdr').andWhere('be.id', null).andWhere('e.last_scraped_utc', null).orderBy('e.created_at', 'desc').limit(LIMIT)
      .fetch()
    let event_url = '', num_saved = 0
    var $c = {}, $d = {}
    for (const event_model of all_evs_wo_band_qb.rows) {
      event_model.last_scraped_utc = (new Date())
      event_model.save()
      // if (node_env === 'live') setTimeout(()=>{}, 8000)
      let event_url = SDR_ROOT + event_model.sdr_name
      let html = {}
      try {
        html = await axios.get(event_url)
      } catch (e) {
        console.error(`axios error: ${e}`)
        event_model.scrape_msg = `Error get html`
        event_model.save()
        continue
      }
      if (html.status === 404) {
        event_model.scrape_msg = `Error html status 404`
        event_model.save()
        continue
      }
      $c = await cheerio.load(html.data)
      file.writeFile('public/ig_sdr_event.html', html.data, (err) => {
      })
      $c('#related-links').each((i, related_link) => {
        let event_a = $c(related_link).find('a:contains("website")')
        if (typeof event_a !== 'object') return
        let url = event_a.attr('href')
        if (typeof url === 'string' && url.startsWith('http') && event_model.website !== url) {
          event_model.website = url
          event_model.last_scraped_utc = (new Date())
          event_model.save()
        }
      })
      let local_art = $c('h4:contains("Local artist page:")')
      if (typeof local_art !== 'object') {
        event_model.scrape_msg = `Error no local artist page`
        event_model.save()
        continue
      }
      let band_anchor = $c(local_art).next('div.image_grid').find('div.item strong > a')
      if (typeof band_anchor !== 'object') {
        event_model.scrape_msg = `Error no band anchor`
        event_model.save()
        continue
      }
      if (event_model.band_urls === band_anchor.attr('href') || ! (band_anchor.attr('href'))) continue
      event_model.band_urls = band_anchor.attr('href')
      //find out if band exists
      let band_name = band_anchor.text()
      if (! band_name) {
        event_model.scrape_msg = `Error no band name`
        event_model.save()
        continue
      }
      let exist_band = await Band.query().where('name', band_name).where('source', 'sdr').fetch()
      if (typeof exist_band === 'object' && exist_band.rows && exist_band.rows.length > 0) {
        event_model.scrape_msg = `Band exist`
        event_model.save()
        continue
      }
      //band doesn't exist; now scraping the band
      let new_band = new Band()
      new_band.source = 'sdr'
      new_band.name = band_name
      if (band_anchor.attr('href')) {
        new_band.scrape_url = norm(SDR_ROOT + band_anchor.attr('href'))
        let band_html = await axios.get(new_band.scrape_url)
        if (band_html.status === 200) {
          $d = await cheerio.load(band_html.data)
          let band_img = $d('a#lead-art__image').css('background-image')
          band_img = norm(band_img.replace("url('", ''), {removeQueryParameters: [/.*/]})
          new_band.logo = band_img
          new_band.website = $d('div.main-content-column a:contains("Visit Website")').attr('href')
          new_band.description = $d('div.main-content-column').text().replace('Sponsored', '').replace(/\n+/g, '\n').replace('Visit Website Share','')
        }
      }
      let band_save_result = await new_band.save()
      if (! band_save_result) {
        event_model.scrape_msg = `Error saving band`
        event_model.save()
        continue
      }
      let new_band_event = new BandEvent()
      new_band_event.event_id = event_model.id
      new_band_event.band_id = new_band.id
      let be_save_result = await new_band_event.save()
      if (! be_save_result) {
        event_model.scrape_msg = `Error saving band_event ${new_band.id} ${event_model.id}`
        event_model.save()
        continue
      }
      num_saved++
      event_model.scrape_msg = `Success. Saved: event ${event_model.id} band ${band_name} . Total ${num_saved}`
      event_model.save()
    }
    console.log(`grabbed all sdr events without band`)
    Database.close()
    process.exit(1);
  }
}

module.exports = Scrape
