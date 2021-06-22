'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const Jslib = require('../../jslib/jslib_global')

class Test extends Command {
  static get signature () {
    return 'test'
  }

  static get description () {
    return 'Test'
  }

  async handle (args, options) {
    const LIMIT = 1
    // const LIMIT = 50
    const Band = use('App/Models/Band')
    const BAND_DB=Database.table('band')
    let all_bands = await BAND_DB.select('id','name','ytlink_first').where('ytlink_first', null).orderBy('created_at', 'desc').limit(LIMIT)
    let new_band = await Band.findOrCreate({name:'sunny war'}, {name:'sunny war'})
    console.log(`new band:  `, new_band)
    Database.close()
    process.exit()
    return ''
  }
}

module.exports = Test
