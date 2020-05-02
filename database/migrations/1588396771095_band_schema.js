'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class BandSchema extends Schema {
  up () {
    this.create('bands', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    this.drop('bands')
  }
}

module.exports = BandSchema
