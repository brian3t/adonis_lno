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
    return 'scrape_skick_deep'
  }

  static get description(){
    return 'LNO scraper. Scrape from SDR, bandmix, songkick, etc..' +
      '08/24: deep scrape songkick'
  }

  async handle(){
    const LIMIT = 1
    // const LIMIT = 150
    console.log(`scrape skick starting`)
    global.conf = require('./conf/songkick.json')
    let node_env = Env.get('NODE_ENV')
    let url = '', num_saved = 0, num_saved_venue = 0, html = {}
    //deep scrape all events


      console.log(`For metro ${metro}, we scraped ${num_saved} events; ${num_saved_venue} venues.\n`)
    // console.log(`Cleaning up: \n`)
    // await Event.query().where('source','skick').where() .delete()
    Database.close()
    process.exit(1);
  }
}

module.exports = Scrape_skick
