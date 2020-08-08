'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class BandEvent extends Model {
  static get table () {
    return 'band_event'
  }

}

module.exports = BandEvent
