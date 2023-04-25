// eslint-disable-next-line
import {Knex} from 'knex'
import { ComicsTable } from '../interfaces/Comics'

declare module 'knex/types/tables' {
  export interface Tables {
    comics: ComicsTable
  }
}
