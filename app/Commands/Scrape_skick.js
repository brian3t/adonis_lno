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

class Scrape_skick extends Command {
  static get signature(){
    return 'scrape_skick'
  }

  static get description(){
    return 'LNO scraper. Scrape from SDR, bandmix, songkick, etc..' +
      '08/22: scrape songkick'
  }

  async handle(){
    const LIMIT = 1
    // const LIMIT = 150
    console.log(`scrape skick starting`)
    global.conf = require('./conf/songkick.json')
    let node_env = Env.get('NODE_ENV')
    let url = '', num_saved = 0, num_saved_venue = 0, html = {}
    for (const metro in conf) {
      if (! conf.hasOwnProperty(metro)) continue
      let metro_conf = conf[metro]
      url = TARGET_ROOT + metro
      try {
        html = await axios.get(url)
      } catch (e) {
        console.error(`axios error: ${e}`)
        continue
      }
      if (html.status === 404) {
        console.error(`Error html status 404`)
        continue
      }
      const $ = await cheerio.load(html.data)
      file.writeFileSync('public/ig_skick_metro.html', html.data, (err) => {
      })
      let ev_name, ev_url
      try
      {
        $('li.event-listings-element').each(async function (i, ev_list){
          const $ev_list = $(this)
          if (typeof ev_list !== 'object' || ! ev_list.attribs || ! ev_list.attribs.title) return
          let status = $ev_list.find('strong.item-state-tag')
          if (status.text && status.text() === 'Canceled' || status.text() === 'Postponed') return
          let ev_date = moment(ev_list.attribs.title, 'dddd DD MMMM YYYY')//Sunday 23 August 2020
          if (! (ev_date.isValid())) return
          ev_name = await $ev_list.find('a.event-link > span > strong')
          if (! ev_name || typeof ev_name !== 'object') return
          ev_name = ev_name.text()
          if (! ev_name || typeof ev_name !== 'string' || ev_name === '') return
          const ev = await Event.findOrCreate(
            {name: ev_name, source: 'skick'}
            , {name: ev_name, source: 'skick', scrape_status: 0, scrape_msg: 'skick init'}
          )
          //model initiated

          ev_url = await $ev_list.find('a.event-link').attr('href')
          if (! ev_url) {
            console.log(`event without url, skipped`);
            return
          }
          ev.scrape_url = `https://songkick.com` + ev_url
          ev.date = ev_date.format('YYYY-MM-DD')
          let artist_img = await $ev_list.find('img.artist-profile-image')
          if (artist_img) ev.img = artist_img.data('src')
          let ven_link = await $ev_list.find('a.venue-link')
          if (ven_link && ven_link.text) {
            let ven_name = ven_link.text()
            if (ven_name) {
              /** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
              const ven = await Venue.findOrCreate({
                name: ven_name, state: conf[metro].state, city: conf[metro].city
              }, {name: ven_name, source: 'skick', state: conf[metro].state, city: conf[metro].city, scrape_status: 0, scrape_msg: 'skick init'})
              ven.scrape_url = `https://songkick.com` + ven_link.attr('href')
              await ven.save()
              num_saved_venue++
              ev.venue_id = ven.id
              await ev.save() //link event with venue
            }
          }
          await ev.save()
          num_saved++
          console.log(`num ev saved: ${num_saved} \n`)
        })
      } catch (e){
        console.error(`error`, e)
      }
      console.log(`For metro ${metro}, we scraped ${num_saved} events; ${num_saved_venue} venues.\n`)
    }
    // console.log(`Cleaning up: \n`)
    // await Event.query().where('source','skick').where() .delete()
    Database.close()
    // process.exit()
  }
}

module.exports = Scrape_skick
