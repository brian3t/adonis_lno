'use strict'

const {Command} = require('@adonisjs/ace')
const Database = use('Database')
const sleep = require('sleep');
const axios = require("axios")
const cheerio = require("cheerio")
const file = require('fs')
const Event = require('../Models/Event')

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

    // /** @type {typeof import('@adonisjs/lucid/src/Database')} */
    const EVENT_DB = Database.table('event as e')
    const EVENT_QUERY = Database.table('event as e')
    let all_evs_wo_band_qb = await Event.query().select('e.id AS id', 'e.source', 'be.id AS bandevid', 'e.sdr_name').from('event as e').leftOuterJoin('band_event as be', 'e.id', 'event_id')
      .where('source', 'sdr').andWhere('be.id', null).orderBy('e.created_at', 'desc').limit(LIMIT)
      .fetch()
    let event_url = ''
    var $c = {}
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
        if (url.startsWith('http')) {

          event_model.website = url
          event_model.save()
          // let sql= EVENT_QUERY.where('id','=',event_model.eventid)
          //   .update({website: url})
          let a = 1
        }
        let b = 1
      })
    }
    console.log(`grabbed all sdr events without band`)
    Database.close()
    return ''
  }
}

module.exports = Scrape
