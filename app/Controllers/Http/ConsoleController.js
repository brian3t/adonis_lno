'use strict'

class ConsoleController {
  async index ({request, response}){
    const Band = use('App/Models/Band')
    let all_bands_qr = Band
      .query()
      .where('ytlink_first',null)
    let all_bands = await all_bands_qr.fetch()
    all_bands.rows.forEach(band=>{
      let a = 1
    })
    let a = 567
    response.send(`done here` + a)
  }
}

module.exports = ConsoleController
