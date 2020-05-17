'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const GoogleService = use('App/Services/Google')
const sleep = require('sleep');

class Console extends Command {
  static get signature () {
    return 'console'
  }

  static get description () {
    return 'LNO console. Runs google service to get Youtube first video'
  }

  async handle (args, options) {
    // const LIMIT = 1
    const LIMIT = 50
    const Band = use('App/Models/Band')
    const BAND_DB=Database.table('band')
    let all_bands = await BAND_DB.select('id','name','ytlink_first').where('ytlink_first', null).orderBy('created_at', 'desc').limit(LIMIT)
    let yt_first_vid = {vid_id:null, thumbnail: null}
    let updated = 0
    for (const band of all_bands) {
      sleep.sleep(10)
      let banddb=BAND_DB.clone()
      yt_first_vid = await GoogleService.yt_find_first_vid(band.name + ' band')
      if (yt_first_vid === null) continue
      let update_result = await banddb.where('id',band.id).update({'ytlink_first':yt_first_vid.vid_id, 'ytlink_first_tnail': yt_first_vid.thumbnail})
      updated += parseInt(update_result)
    }
    console.log(`done here`)
    console.log(`affected:  `, updated, ` last youtube vid: `, yt_first_vid)
    Database.close()
    return ''
  }
}

module.exports = Console
