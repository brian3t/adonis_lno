'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Venue extends Model {
  static get table () {
    return 'venue'
  }
}

module.exports = Venue
