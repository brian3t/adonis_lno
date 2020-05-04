'use strict'
const Database = use('Database')
const GoogleService = use('App/Services/Google')

class ConsoleController {
  async index({request, response}){
    const LIMIT = 1
    const Band = use('App/Models/Band')
    const band_db=Database.table('band')
    let all_bands = await band_db.select('id','name','ytlink_first').limit(LIMIT).where('ytlink_first', null)
    let yt_first_vid = {vid_id:null, thumbnail: null}
    let updated = 0

    for (const band of all_bands) {
      let banddb=band_db.clone()
      yt_first_vid = await GoogleService.yt_find_first_vid(band.name + ' band')
      if (yt_first_vid === null) continue
      let update_result = await banddb.where('id',band.id).update({'ytlink_first':yt_first_vid.vid_id, 'ytlink_first_tnail': yt_first_vid.thumbnail})
      updated += parseInt(update_result)
    }
    response.send(`done here`)
    response.send(`affected:  `, updated, ` last youtube vid: `, yt_first_vid)
  }
}

module.exports = ConsoleController
