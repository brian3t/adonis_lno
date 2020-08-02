'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const sleep = require('sleep');

class Console extends Command {
  static get signature () {
    return 'console'
  }

  static get description () {
    return 'LNO scraper. Scrape from SDR, bandmix, etc..'
  }

  async handle () {
    // const LIMIT = 1
    const LIMIT = 50
    const Band = use('App/Models/Band')
    const BAND_DB=Database.table('band')
    let all_bands = await BAND_DB.select('id','name','ytlink_first').where('ytlink_first', null).orderBy('created_at', 'desc').limit(LIMIT)
    console.log(`todo: grab all sdr events without band`)
    Database.close()
    return ''
  }
}

module.exports = Console
