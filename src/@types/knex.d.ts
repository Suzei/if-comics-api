// eslint-disable-next-line
import {Knex} from 'knex'
import { ComicsTable } from '../interfaces/Comics'
import { ChaptersTable } from '../interfaces/Chapters'
import { UsersTable } from '../interfaces/Users'

declare module 'knex/types/tables' {
  export interface Tables {
    comics: ComicsTable
    chapters: ChaptersTable
    users: UsersTable
  }
}
