'use strict'
const Database = use('Database')

class ConsoleController {
  async index({request, response}){
    const Band = use('App/Models/Band')
    const band_db=Database.table('band')
    let all_bands = await band_db.select('id','ytlink_first')
    for (const band of all_bands) {
      let banddb=band_db.clone()
      const affected  = await banddb.where('id',band.id).update({'ytlink_first':'test'})
      response.send(`affected:  `, affected, `id: ${band.id}`)
    }
    response.send(`done here`)
  }
}

module.exports = ConsoleController
