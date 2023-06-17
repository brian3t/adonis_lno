'use strict'

const { Command } = require('@adonisjs/ace')
const Database = use('Database')
const Jslib = require('../../jslib/jslib_global')

class Asdf extends Command {
  static get signature () {
    return 'asdf'
  }

  static get description () {
    return 'Asdf'
  }

  async handle (args, options) {
    const LIMIT = 1
    // const LIMIT = 50
    console.log(`asdf`)
    process.exit()
    return ''
  }
}

module.exports = Asdf
