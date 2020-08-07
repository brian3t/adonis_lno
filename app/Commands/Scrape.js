'use strict'

const {Command} = require('@adonisjs/ace')
const sleep = require('sleep');
const axios = require("axios")
const cheerio = require("cheerio")
const Database = use('Database')
const file = require('fs')
const norm = require('normalize-url')


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
    const LIMIT = 1
    // const LIMIT = 50
    /** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
    const Event = use('App/Models/Event')
    const Band = use('App/Models/Band')

    // /** @type {typeof import('@adonisjs/lucid/src/Database')} */
    const EVENT_DB = Database.table('event as e')
    const EVENT_QUERY = Database.table('event as e')
    let all_evs_wo_band_qb = await Event.query().select('e.id AS id', 'e.source', 'e.website', 'e.band_urls', 'be.id AS bandevid', 'e.sdr_name')
      .from('event as e').leftOuterJoin('band_event as be', 'e.id', 'event_id')
      .where('source', 'sdr').andWhere('be.id', null).orderBy('e.created_at', 'desc').limit(LIMIT)
      .fetch()
    let event_url = ''
    var $c = {}, $d = {}
    for (const event_model of all_evs_wo_band_qb.rows) {
      let event_url = SDR_ROOT + event_model.sdr_name
      let html = await axios.get(event_url)
      $c = await cheerio.load(html.data)
      file.writeFile('public/ig_sdr_event.html', html.data, (err) => {
      })
      $c('#related-links').each((i, related_link) => {
        let event_a = $c(related_link).find('a:contains("website")')
        if (typeof event_a !== 'object') return
        let url = event_a.attr('href')
        if (url.startsWith('http') && event_model.website !== url) {
          event_model.website = url
          event_model.save()
        }
      })
      let local_art = $c('h4:contains("Local artist page:")')
      if (typeof local_art !== 'object') continue
      let band_anchor = $c(local_art).next('div.image_grid').find('div.item strong > a')
      if (typeof band_anchor !== 'object') continue
      if (event_model.band_urls === band_anchor.attr('href')) continue
      event_model.band_urls = band_anchor.attr('href')
      //find if band exists
      let band_name = band_anchor.text()
      let band_model = await Band.query().where('name', band_name).where('source', 'sdr').fetch()
      if (typeof band_model !== 'object' || ! (band_model.rows) || band_model.rows.length > 0) continue
      //now scraping the band
      let new_band = new Band()
      new_band.source = 'sdr'
      new_band.name = band_name
      new_band.scrape_url = norm(SDR_ROOT + band_anchor.attr('href'))
      let band_html = await axios.get(new_band.scrape_url)
      $d = await cheerio.load(band_html.data)
      let band_img = $d('a#lead-art__image').css('background-image')
      band_img = norm(band_img.replace("url('", ''), {removeQueryParameters: [/.*/]})
      new_band.website = $d('div.main-content-column a:contains("Visit Website")').attr('href')
      new_band.description = $d('div.main-content-column').text().replace('Sponsored','').replace(/\n+/g,'\n')
      // new_band.save()
      let a = 1
    }
    console.log(`grabbed all sdr events without band`)
    Database.close()
    return ''
  }
}

module.exports = Scrape
