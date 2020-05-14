'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const GoogleService = use('App/Services/Google')

class Console extends Command {
  static get signature () {
    return 'console'
  }

  static get description () {
    return 'Tell something helpful about this command'
  }

  async handle (args, options) {
    const LIMIT = 1
    const Band = use('App/Models/Band')
    const band_db=Database.table('band')
    let all_bands = await band_db.select('id','name','ytlink_first').where('ytlink_first', null).limit(LIMIT)
    let yt_first_vid = {vid_id:null, thumbnail: null}
    let updated = 0
    for (const band of all_bands) {
      let banddb=band_db.clone()
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
