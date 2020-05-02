'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Band extends Model {
  static get table () {
    return 'band'
  }

}

module.exports = Band
