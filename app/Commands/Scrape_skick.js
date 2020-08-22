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

class Scrape_skick extends Command {
  static get signature(){
    return 'scrape_skick'
  }

  static get description(){
    return 'LNO scraper. Scrape from SDR, bandmix, etc..' +
      '08/02: scrape SDR for now'
  }

  async handle(){
    const LIMIT = 1
    // const LIMIT = 150
    console.log(`scrape skick starting`)
    const conf = require('./conf/songkick.json')
    let a = 1

    for (let metro in conf){
      if (!conf.hasOwnProperty(metro)) continue
      let metro_conf = conf[metro]
      let a = 1

    }
  }
}
module.exports = Scrape_skick
