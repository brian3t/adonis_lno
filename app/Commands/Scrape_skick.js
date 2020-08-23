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
    var $c = {}

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
      $c = await cheerio.load(html.data)
      file.writeFile('public/ig_skick_metro.html', html.data, (err) => {
      })
      $c('li.event-listings-element').each(function (i, event_listing){
        let a = 1

      })
      let a = 1

    }
  }
}

module.exports = Scrape_skick
