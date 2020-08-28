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
const moment = require('moment')

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
    const LIMIT = 1
    // const LIMIT = 150
    console.log(`scrape skick deep starting`)
    let node_env = Env.get('NODE_ENV')
    let url = '', num_saved = 0, num_saved_venue = 0, html = {}
    //deep scrape all events
    let all_evs = await Event.query().select('id', 'name', 'scrape_url').where('source', 'skick').where('scrape_status', 0)
      .whereRaw('COALESCE(last_scraped_utc,\'1970-02-01\') < DATE_SUB(CURDATE(), INTERVAL 1 HOUR)')
      .orderBy('created_at', 'desc').limit(LIMIT).fetch()

    for (const ev of all_evs.rows) {
      ev.last_scraped_utc = new Date()
      await ev.save()
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
      const ev_model = await Event.find(ev.id)
      if (typeof ev_model !== 'object') continue
      file.writeFile('public/ig_skick_event_deep.html', html.data, (err) => {
      })
      $c('div.additional-details-container p').each(async (i, p) => {
        let $p = $c(p)
        if ($p.text().startsWith('Doors open:')) {
          let door_open = $p.text().replace('Doors open: ', '') //20:30
          if (moment(door_open, 'hh:mm', true)) {
            // ev_model.start_time = door_open
            // ev.scrape_status = 1 //asdf
            // if (ev_model.scrape_msg === undefined) ev_model.scrape_msg = ''
            // ev_model.scrape_msg += ' | starttime in'
            ev_model.scrape_msg='test'
            await ev_model.save()

            let a = 1
          }
        }
      })
      let a = 1

    }

    // console.log(`Cleaning up: \n`)
    // await Event.query().where('source','skick').where() .delete()
    Database.close()
  }
}

module.exports = Scrape_skick_deep
