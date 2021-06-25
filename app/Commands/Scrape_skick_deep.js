'use strict'
const log = require('why-is-node-running') // should be your first require

const {Command} = require('@adonisjs/ace')
const Jslib = require('../../jslib/jslib_global')
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
const valid_url = require('valid-url')

const TARGET_ROOT = 'https://www.songkick.com/metro-areas/'
const AXIOS_CONF = {timeout: 3000}

const knex = require('knex')({
  client: Env.get('DB_CONNECTION'),
  connection: {
    host: Env.get('DB_HOST') || '127.0.0.1',
    user: Env.get('DB_USER') || 'admin',
    password: Env.get('DB_PASSWORD') || 'putpw_to_env',
    database: Env.get('DB_DATABASE') || 'putdb_name_to_env'
  }
})


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
    console.log(`scrape skick bands starting`)
    const node_env = Env.get('NODE_ENV')
    const url = '', num_saved = 0, num_saved_venue = 0
    let html = {}, band_html = {}, ev_save_prom, ven_save_prom, band_save_prom, ev_save_res, ven_save_res, band_save_res
      , num_band_saved = 0, num_ev_saved = 0, num_ven_saved = 0
    //deep scrape all events
    /** @type {typeof import('knex/lib/query/builder')} */
    const all_evs = await knex('event').where({source: 'skick', scrape_status: 0}).columns('id', 'name', 'scrape_url')
      // .where('name','Amaranthe and Battle Beast') //zsdf
      .whereRaw('COALESCE(last_scraped_utc,\'1970-01-01\') < DATE_SUB(CURDATE(), INTERVAL 1 HOUR)')
      .orderBy('created_at', 'desc').limit(LIMIT)

    console.log(`Scraping deep songkick events, count: `, all_evs.length)
    let all_proms = []
    setTimeout(function (){
      log() // logs out active handles that are keeping node running
    }, 5000)

    for (const ev of all_evs) {
      console.log(`ev name`, ev.name)
      console.log(`ev scrapeurl`, ev.scrape_url)
      ev.last_scraped_utc = new Date()
      if (! valid_url.isUri(ev.scrape_url)) {
        ev.scrape_status = -2
        ev.scrape_msg = `Invalid scrape_url; skipping`
        ev_save_prom = ev.save()
        all_proms.push(ev_save_prom)
        ev_save_res = await ev_save_prom
        if (ev_save_res) num_ev_saved++
        continue
      }
      ev_save_prom = ev.save()
      all_proms.push(ev_save_prom)
      ev_save_res = await ev_save_prom
      if (ev_save_res) num_ev_saved++
      console.log(`evmodel last updated`, ev.updated_at)
      try {
        html = await Jslib.sup_get(ev.scrape_url)
      } catch (e) {
        console.error(`axios error: ${e}`)
        ev.scrape_status = -1
        ev.scrape_msg = `axios error ${e}`
        ev_save_prom = ev.save()
        all_proms.push(ev_save_prom)
        ev_save_res = await ev_save_prom
        if (ev_save_res) num_ev_saved++
        continue
      }
      if (html.status === 404) {
        console.error(`Error ev html status 404`)
        continue
      }
      let $c = await cheerio.load(html.text)
      file.writeFile('public/ig_skick_event_deep.html', html.text, (err) => {
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
            ev_save_prom = ev.save()
            all_proms.push(ev_save_prom)
            ev_save_res = await ev_save_prom
            if (ev_save_res) num_ev_saved++
          }
        }
      })
      let profile_img = await $c('img.profile-picture.event')
      if (profile_img && typeof profile_img === 'object') {
        ev.img = $c(profile_img).data('src')
        ev_save_prom = ev.save()
        all_proms.push(ev_save_prom)
        ev_save_res = await ev_save_prom
        if (ev_save_res) num_ev_saved++
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
        ven_save_prom = ven.save()
        all_proms.push(ven_save_prom)
        ven_save_res = await ven_save_prom
        if (ven_save_res) num_ven_saved++
      }
      if (! ven_addr_lines[1]) return
      const zip = ven_addr_lines[1]
      if (zip) {
        ven.zip = $c(zip).text()
        ven_save_prom = ven.save()
        all_proms.push(ven_save_prom)
        ven_save_res = await ven_save_prom
        if (ven_save_res) num_ven_saved++
      }
      //now pulling band details
      await $c('div.expanded-lineup-details > ul > li').each(async (i, band_li) => {
        const band_anchor = await $c($c(band_li).find('div.main-details > span > a'))
        const band_name = await band_anchor.text(), band_url = `https://songkick.com` + await band_anchor.attr('href')
        console.log(`band name: ${band_name}`)
        const band = await Band.findOrCreate({name: band_name}, {name: band_name, source: 'skick', scrape_url: band_url})
        if (! (band instanceof Band)) {
          console.error(`Cannot find or create band ${band_name}`)
          return
        }
        band.source = 'skick'//no matter what the source was, for now let's focus on scraping band from songkick
        band.scrape_url = band_url
        band_save_prom = band.save()
        all_proms.push(band_save_prom)
        band_save_res = await band_save_prom
        if (band_save_res) num_band_saved++
        const band_event = await BandEvent.findOrCreate({band_id: band.id, event_id: ev.id}, {band_id: band.id, event_id: ev.id})
        try {
          band_html = await Jslib.sup_get(band_url, AXIOS_CONF)
        } catch (e) {
          console.error(`axios error: ${e}`)
        }
        if (band_html.status === 404) {
          console.error(`Error band html status 404`)
        }
        band.last_scraped = new Date()
        band_save_prom = band.save()
        all_proms.push(band_save_prom)
        band_save_res = await band_save_prom
        if (band_save_res) num_band_saved++
        let $b = await cheerio.load(band_html.text)
        let band_img = await $b('div.profile-picture-wrap img.artist-profile-image')
        if (band_img && typeof band_img === 'object') {
          band_img = band_img.data('src')
          if (band_img) {
            band.logo = band_img
            band_save_prom = band.save()
            all_proms.push(band_save_prom)
            band_save_res = await band_save_prom
            if (band_save_res) num_band_saved++
            console.log(`band updated at ` + band.updated_at)
          }
        }
        let b_video_link_first = await $b('div.video-standfirst iframe')
        if (b_video_link_first && typeof b_video_link_first === 'object') {
          b_video_link_first = b_video_link_first.attr('src') ////www.youtube-nocookie.com/embed/8lKYdrL-AAw
          if (b_video_link_first && b_video_link_first.includes('youtube')) {
            b_video_link_first = b_video_link_first.split('/').pop()
            if (b_video_link_first) {
              band.ytlink_first = b_video_link_first
              band_save_prom = band.save()
              all_proms.push(band_save_prom)
              band_save_res = await band_save_prom
              if (band_save_res) num_band_saved++
              console.log(`band updated yt_vid at `, band.updated_at)
            }
          }
          let a = 1

        }
      })
      ev.scrape_status = 1
      ev.scrape_msg = `Finished scraping`
      ev_save_prom = ev.save()
      all_proms.push(ev_save_prom)
      ev_save_res = await ev_save_prom
      if (ev_save_res) num_ev_saved++
    }

    console.log(`Events saved: `, num_ev_saved, ' | Venues saved: ', num_ven_saved, ` | Bands saved: `, num_band_saved)

    console.log(`Cleaning up: \n`)
    await Promise.all(all_proms)
    console.log(`db closing`)
    Database.close()
    console.log(`db closed`)
    process.exit()
  }

}


module.exports = Scrape_skick_deep
