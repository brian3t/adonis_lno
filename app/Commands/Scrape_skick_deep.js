'use strict'

const {Command} = require('@adonisjs/ace')
const sleep = require('sleep');
const axios = require("axios")
const cheerio = require("cheerio")
const Database = use('Database')
const file = require('fs')
const norm = require('normalize-url')
const Event = use('App/Models/Event')
const Venue = use('App/Models/Venue')
const Band = use('App/Models/Band')
const BandEvent = use('App/Models/BandEvent')
const Env = use('Env')
const moment = require('moment-timezone')

const TARGET_ROOT = 'https://www.songkick.com/metro-areas/'

class Scrape_skick_deep extends Command {
  static get signature(){
    return 'scrape_skick_deep'
  }

  static get description(){
    return 'LNO scraper. Scrape from SDR, bandmix, songkick, etc..' +
      '08/24: deep scrape songkick'
  }

  async handle(){
    // const LIMIT = 1
    const LIMIT = 150
    console.log(`scrape skick deep starting`)
    const node_env = Env.get('NODE_ENV')
    let url = '', num_saved = 0, num_saved_venue = 0, html = {}
    //deep scrape all events
    /** @type {typeof import('knex/lib/query/builder')} */
    const all_evs = await Event.query().select('id', 'name', 'scrape_url').where('source', 'skick').where('scrape_status', 0)
      .whereRaw('COALESCE(last_scraped_utc,\'1970-01-01\') < DATE_SUB(CURDATE(), INTERVAL 1 HOUR)')
      // .where('name','Typesetter and Get Married') //asdf
      .orderBy('created_at', 'desc').limit(LIMIT).fetch()

    for (const ev of all_evs.rows) {
      console.log(`ev name`, ev.name)
      ev.last_scraped_utc = new Date()
      await ev.save()
      console.log(`evmodel last updated`, ev.updated_at)
      try {
        html = await axios.get(ev.scrape_url)
      } catch (e) {
        console.error(`axios error: ${e}`)
        continue
      }
      if (html.status === 404) {
        console.error(`Error html status 404`)
        continue
      }
      let $c = await cheerio.load(html.data)
      file.writeFile('public/ig_skick_event_deep.html', html.data, (err) => {
      })
      await $c('div.additional-details-container p').each(async (i, p) => {
        let $p = await $c(p)
        if ($p.text().startsWith('Doors open:')) {
          let door_open = $p.text().replace('Doors open: ', '') //20:30
          door_open = moment(door_open, 'HH:mm', true)
          if (door_open.isValid()) {
            ev.start_time = door_open.format('HH:mm')
            ev.start_time_utc = door_open.clone().tz('UTC').format('HH:mm')
            ev.scrape_status = 1
            if (ev.scrape_msg === undefined) ev.scrape_msg = ''
            ev.scrape_msg += ' | starttime in'
            await ev.save()
          }
        }
      })
      let profile_img = await $c('img.profile-picture.event')
      if (profile_img && typeof profile_img === 'object') {
        ev.img = $c(profile_img).data('src')
        await ev.save()
        console.log(`evmodel last updated`, ev.updated_at)
      }

      //now pulling in venue details
      let $ven_details = await $c('div.venue-info-details')
      let ven_name = await $ven_details.find('> a.url').text()
      const ven = await Venue.findOrCreate({source: 'skick', name: ven_name}, {
        source: 'skick', name: ven_name
      })
      const ven_hcard = await $ven_details.find('p.venue-hcard')
      const ven_addr_lines = await ven_hcard.find('> span > span')
      if (! ven_addr_lines[0]) return
      const addr1 = ven_addr_lines[0]
      if (addr1 && addr1 !== '') {
        ven.address1 = $c(addr1).text()
        await ven.save()
      }
      if (! ven_addr_lines[1]) return
      const zip = ven_addr_lines[1]
      if (zip) {
        ven.zip = $c(zip).text()
        await ven.save()
      }
    }


    // console.log(`Cleaning up: \n`)
    // await Event.query().where('source','skick').where() .delete()
    // Database.close()
  }
}

module.exports = Scrape_skick_deep
