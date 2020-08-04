'use strict'

const {Command} = require('@adonisjs/ace')
const Database = use('Database')
const sleep = require('sleep');

class Scrape extends Command {
  static get signature(){
    return 'scrape'
  }

  static get description(){
    return 'LNO scraper. Scrape from SDR, bandmix, etc..' +
      '08/02: scrape SDR for now'
  }

  async handle(){
    // const LIMIT = 1
    const LIMIT = 50
    /** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
    const Event = use('App/Models/Event')

    // /** @type {typeof import('@adonisjs/lucid/src/Database')} */
    const EVENT_DB = Database.table('event as e')
    let all_evs_wo_band_qb = await EVENT_DB.select('e.id AS eventid', 'e.source', 'be.id AS bandevid', 'e.').leftOuterJoin('band_event as be', 'e.id', 'event_id')
      .where('source', 'sdr').andWhere('be.id', null).orderBy('e.created_at', 'desc').limit(LIMIT)

    console.log(`grabbed all sdr events without band`)
    Database.close()
    return ''
  }
}

module.exports = Scrape
