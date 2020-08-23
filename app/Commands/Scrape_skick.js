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
    const conf = require('./conf/songkick.json')
    let node_env = Env.get('NODE_ENV')
    let url = '', num_saved = 0, html = {}
    for (let metro in conf) {
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
      file.writeFile('public/ig_skick_metro.html', html.data, (err) => {
      })
      $('li.event-listings-element').each(function (i, ev_list){
        const $ev_list = $(this)
        let status = $ev_list.find('strong.item-state-tag')
        if (status.text && status.text() === 'Canceled' || status.text() === 'Postponed') return
        const ev = new Event()
        if (typeof ev_list !== 'object' || ! ev_list.attribs || ! ev_list.attribs.title) return
        let date = moment(ev_list.attribs.title,'dddd DD MMMM YYYY')//Sunday 23 August 2020
        if (date.isValid()){
          ev.date = date.format('YYYY-MM-DD')
        }
        let artist_img = $ev_list.find('img.artist-profile-image')
        if (artist_img) ev.img = artist_img.prop('src') ////assets.sk-static.com/assets/images/default_images/large_avatar/default-artist.a8e9d06fcef5440088394dacafbcf19a.png
        // ??? need to pull ??? https://images.sk-static.com/images/media/profile_images/artists/10042834/large_avatar
        let a = 1

      })
      let a = 1

    }
  }
}

module.exports = Scrape_skick
