import { beforeEach, describe, expect, it } from 'vitest'
import { GameDataLoader } from '../../src/dataLoaders/gameDataLoader'
import { initTestPinia, loadStaticData } from '../_setup/pinia'
import { Tile } from '../../src/objects/gameObjects'

describe('gameDataLoader', () => {
  beforeEach(() => initTestPinia() && loadStaticData())

  it('Throws on missing/invalid key/data', () => {
    const loader = new GameDataLoader()

    const missingKey = {}
    expect(() =>
      loader.load({ objects: [missingKey] })
    ).toThrow(
      `Invalid game obj data: key is missing from ${JSON.stringify(missingKey)}`
    )

    const invalidKey = { 'key': 'test' }
    expect(() =>
      loader.load({ objects: [invalidKey] })
    ).toThrow(
      `Invalid game obj data: key 'test' must be format '{class}:{id}'`
    )

    const invalidClass = { 'key': 'test:1' }
    expect(() =>
      loader.load({ objects: [invalidClass] })
    ).toThrow(
      `Invalid game obj class: undefined in config for class 'test'`
    )

    const withoutName = {
      'key': 'player:1'
    }
    expect(() =>
      loader.load({ objects: [withoutName] })
    ).toThrow(
      `Required attribute 'name' missing from ${JSON.stringify(withoutName)}`
    )

    const invalidTypeKey = {
      'key': 'culture:1',
      'type': 'majorCultureType:test',
      'playerKey': 'player:1',
    }
    expect(() =>
      loader.load({ objects: [invalidTypeKey] })
    ).toThrow(
      `[objects] Unknown key: majorCultureType:test`
    )

    const playerData = {
      'key': 'player:1',
      'name': 'test player',
    }
    const invalidRelationKey = {
      'key': 'culture:1',
      'type': 'majorCultureType:viking',
      'playerKey': 'player:2',
    }
    expect(() =>
      loader.load({ objects: [playerData, invalidRelationKey] })
    ).toThrow(
      `Error processing attr 'playerKey' of culture:1: Error: [objects] Unknown key: player:2`
    )
  })

  it('Build game objects and returns correct JSON, without optional', () => {
    const loader = new GameDataLoader()

    // todo Agenda
    const citizenData = {
      key: 'citizen:1',
      cityKey: 'city:1',
      cultureKey: 'culture:1',
      tileKey: 'tile:1',
    }
    const cityData = {
      key: 'city:1',
      playerKey: 'player:1',
      tileKey: 'tile:1',
      name: 'test city',
    }
    // todo Construction
    const cultureData = {
      key: 'culture:1',
      type: 'majorCultureType:viking',
      playerKey: 'player:1',
    }
    // todo Deal
    const playerData = {
      key: 'player:1',
      name: 'test player',
    }
    const religionData = {
      key: 'religion:1',
      name: 'test religion',
      myths: ['mythType:godMother'],
      gods: ['godType:godOfTrade'],
      dogmas: ['dogmaType:clergy'],
      cityKey: 'city:1',
    }
    const tileData = {
      key: Tile.getKey(12, 23),
      x: 12,
      y: 23,
      domain: 'domainType:land',
      area: 'continentType:taiga',
      climate: 'climateType:cold',
      terrain: 'terrainType:tundra',
      elevation: 'elevationType:hill',
    }
    const tradeRouteData = {
      key: 'tradeRoute:1',
      playerKey: 'player:1',
    }
    const unitData = {
      key: 'unit:1',
      cityKey: 'city:1',
      designKey: 'design:1',
      playerKey: 'player:1',
      tileKey: 'tile:1',
    }
    const unitDesignData = {
      key: 'unitDesign:1',
      platform: 'platformType:human',
      equipment: 'equipmentType:axe',
      name: 'Axeman',
      playerKey: 'player:1',
    }

    const gameObjects = loader.load({
      objects: [
        citizenData,
        cityData,
        cultureData,
        playerData,
        religionData,
        tileData,
        tradeRouteData,
        unitData,
        unitDesignData,
      ]
    })

    const playerDataWithDefaults = { ...playerData, 'isCurrent': false }
    expect(gameObjects.map(o => o.toJSON())).toEqual([
      [
        citizenData,
        cityData,
        cultureData,
        playerDataWithDefaults,
        religionData,
        tileData,
        tradeRouteData,
        unitData,
        unitDesignData,
      ]
    ])
  })

  it('Build game objects and returns correct JSON, with optional', () => {
    const loader = new GameDataLoader()

    const playerData = {
      'key': 'player:1',
      'name': 'test player',
      'isCurrent': true
    }

    const gameObjects = loader.load({ objects: [playerData] })

    expect(gameObjects).toHaveLength(1)

    expect(gameObjects[0].toJSON()).toEqual(playerData)
  })
})