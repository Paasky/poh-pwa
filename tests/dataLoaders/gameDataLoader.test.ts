import { beforeEach, describe, expect, it } from 'vitest'
import { GameDataLoader } from '../../src/dataLoaders/gameDataLoader'
import { initTestPinia, loadStaticData } from '../_setup/pinia'
import { Tile } from '../../src/objects/game/gameObjects'

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
      `[objStore] Tried to get(majorCultureType:test), key does not exist in store`
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
      `obj: culture:1, conf: {"attrName":"playerKey","related":{"theirKeyAttr":"cultureKey","isOne":true}}, msg: [objStore] Tried to get(player:2), key does not exist in store`
    )
  })

  it('Build game objects and returns correct JSON, without optional', () => {
    const loader = new GameDataLoader()

    const tileCoords = { x: 12, y: 23 }
    const tileKey = Tile.getKey(tileCoords.x, tileCoords.y)

    // todo Agenda
    const citizenData = {
      key: 'citizen:1',
      cityKey: 'city:1',
      cultureKey: 'culture:1',
      tileKey: tileKey,
    }
    const cityData = {
      key: 'city:1',
      playerKey: 'player:1',
      tileKey: tileKey,
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
      key: tileKey,
      x: tileCoords.x,
      y: tileCoords.y,
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
      designKey: 'unitDesign:1',
      playerKey: 'player:1',
      tileKey: tileKey,
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

    // output = input + defaults
    expect(gameObjects.map(o => o.toJSON())).toEqual([
      citizenData,
      { ...cityData, canAttack: false, health: 100, isCapital: false, origPlayerKey: 'player:1' },
      cultureData,
      { ...playerData, 'isCurrent': false },
      religionData,
      tileData,
      tradeRouteData,
      { ...unitData, canAttack: false, health: 100, moves: 0, name: '', origPlayerKey: 'player:1' },
      { ...unitDesignData, isActive: true, isElite: false },
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