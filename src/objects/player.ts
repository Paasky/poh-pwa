import { computed, ref, watch } from 'vue'
import { HasPlayer } from '@/objects/gameMixins'
import { GameKey, Player, UnitDesign, UnitStatus } from '@/objects/gameObjects'
import { TypeObject } from '@/types/typeObjects'
import { CatKey, roundToTenth, TypeKey, upgradeTree } from '@/types/common'
import { useObjectsStore } from '@/stores/objectStore'
import { Yields } from '@/objects/yield'

const objStore = useObjectsStore()

export class Government extends HasPlayer(Object) {
  corruption = ref(0)
  discontent = ref(0)

  policies = ref([] as TypeObject[])
  selectablePolicies = computed(() => this.player.value.knownTypes.value.filter(
    t => t.class === 'policyType'
  ))

  hasElections = computed(() => this.policies.value.some(
    (p) => p.specials.includes('specialType:elections'))
  )
  nextElection = ref(0)

  canBuyBuildings = computed(() => !this.policies.value.some(
    p => p.specials.includes('specialType:cannotBuyBuildings')
  ))
  canControlConstruction = computed(() => !this.policies.value.some(
    p => p.specials.includes('specialType:forceAutomaticBuildQueue')
  ))
  canControlTraining = computed(() => !this.policies.value.some(
    p => p.specials.includes('specialType:cannotBuildUnits')
  ))
  canDeclineTrade = computed(() => !this.policies.value.some(
    p => p.specials.includes('specialType:cannotDeclineTrade')
  ))
  canLevyUnits = computed(() => this.policies.value.some(
    p => p.specials.includes('specialType:canLevy')
  ))
  canTradeNonAllies = computed(() => !this.policies.value.some(
    p => p.specials.includes('specialType:cannotTradeNonAllies')
  ))
  hasStateReligion = computed(() => this.policies.value.some(
    p => p.specials.includes('specialType:forcedStateReligion')
  ))
  unitStartStatus = computed((): UnitStatus => this.policies.value.some(
    p => p.specials.includes('specialType:canMobilize')
  ) ? 'reserve' : 'regular')

  yields = computed(() => new Yields(this.policies.value.flatMap(
    p => p.yields.all()
  )))

  setPolicies (policies: TypeObject[]) {
    if (this.hasElections.value) throw new Error(`Player ${this.player.value.name} cannot change policy with elections`)
    const errors = [] as string[]
    policies.forEach(p => {
      if (!this.selectablePolicies.value.includes(p)) errors.push(`Player ${this.player.value.name} cannot select policy ${p.name}`)
      if (this.policies.value.includes(p)) errors.push(`Player ${this.player.value.name} already has policy ${p.name}`)
    })
    if (errors.length) throw new Error(errors.join('\n'))

    // Remove any prev policy with the same category
    const newPolicies = this.policies.value.filter(p => !policies.some(np => np.category === p.category))
    newPolicies.push(...policies)

    // Set Policies & add discontent (100%/policy)
    this.policies.value = newPolicies
    this.discontent.value = roundToTenth(this.discontent.value + policies.length * 100)
  }

  runElections () {
    if (!this.hasElections.value) throw new Error(`Player ${this.player.value.name} cannot run elections`)
    if (this.nextElection.value > 0) throw new Error(`Player ${this.player.value.name} cannot run elections yet`)

    // Find the top policy per category (top = most citizens with policy)
    const countedPolicies = {} as Record<CatKey, Record<TypeKey, { policy: TypeObject, citizens: number }>>
    this.selectablePolicies.value.forEach(p => {
      const cat = p.category as CatKey
      if (!countedPolicies[cat]) countedPolicies[cat] = {}
      countedPolicies[cat][p.key] = {
        policy: p as TypeObject,
        citizens: this.player.value.citizens.value.filter(c => c.policy.value === p).length
      }
    })
    const topPolicies = {} as Record<CatKey, TypeObject>
    for (const cat in countedPolicies) {
      const sorted = Object.values(countedPolicies[cat as CatKey])
        .sort((a, b) => b.citizens - a.citizens)
      topPolicies[cat as CatKey] = sorted[0].policy
    }

    // Filter out top policies that are already selected and set those
    this.setPolicies(Object.values(topPolicies).filter(p => !this.policies.value.includes(p)))

    // Remove up to 100% discontent
    this.discontent.value = Math.max(0, roundToTenth(this.discontent.value - 100))

    // Set next elections in 25 turns
    this.nextElection.value = 25
  }

  startTurn () {
    // Corruption (negative disorder)
    // Elections: Go up +1%/t for 1st 100t, then speed up to +3%/t
    // Authoritarian: Go up +2%/t for 1st 100t, then speed up to +4%/t
    const slow = this.hasElections.value ? 1 : 2
    const quick = this.hasElections.value ? 3 : 4
    this.corruption.value = roundToTenth(
      this.corruption.value + (this.corruption.value < (slow * 100) ? slow : quick)
    )

    if (this.hasElections.value) {
      this.nextElection.value = Math.max(0, this.nextElection.value - 1)

      // Disorder (negative happiness)
      if (this.nextElection.value > 0) {
        // Discontent increases slowly (+2%/t)
        this.discontent.value = roundToTenth(this.discontent.value + 2)
      } else {
        // Discontent increases quickly (+20%/t) if ignoring elections
        this.discontent.value = roundToTenth(this.discontent.value + 20)
      }
    } else {
      // No elections -> Discontent disappears slowly (2%/t)
      this.discontent.value = Math.max(0, roundToTenth(this.discontent.value - 2))
    }
  }

  constructor (playerKey: GameKey) {
    super()
    this.playerKey.value = playerKey
  }
}

export class Research extends HasPlayer(Object) {
  researched = ref<TypeObject[]>([])
  researching = ref<Record<TypeKey, { progress: number, target: TypeObject }>>({})
  current = ref<TypeObject | null>(null)
  queue = ref<TypeObject[]>([])
  era = computed((): TypeObject | null => {
    if (!this.researched.value.length) return null
    const highestType = this.researched.value.reduce<TypeObject | null>((highest, current) => {
      if (!highest) return current as TypeObject
      const curY = current.y!
      const hiY = highest.y!
      return (curY > hiY)
        ? current as TypeObject
        : highest as TypeObject
    }, null)

    // Fallback: earliest era
    return objStore.getTypeObject(highestType!.category as TypeKey)
  })

  complete (tech: TypeObject) {
    if (this.researched.value.includes(tech)) return

    // It's now researched
    this.researched.value.push(tech)
    delete this.researching.value[tech.key]

    // Remove from current and queue if it was in either
    if (this.current.value === tech) this.current.value = null
    this.queue.value = this.queue.value.filter(t => t !== tech)

    // Not researching anything anymore and there is something in the queue: start next in the queue
    if (!this.current.value && this.queue.value.length) this.current.value = this.queue.value[0]
  }

  constructor (playerKey: GameKey) {
    super()
    this.playerKey.value = playerKey
  }
}

export class UnitDesignPrototype {
  player: Player | null

  platform = ref<TypeObject | null>(null)
  knownPlatforms = computed((): TypeObject[] => this.player?.knownTypes.value.filter(
    t => t.class === 'platformType'
  ) ?? [])
  availablePlatforms = computed((): TypeObject[] => this.knownPlatforms.value.filter(
    p => this.knownEquipments.value.find(e => p.key in e.names!)
  ))

  equipment = ref<TypeObject | null>(null)
  knownEquipments = computed((): TypeObject[] => this.player?.knownTypes.value.filter(
    t => t.class === 'equipmentType'
  ) ?? [])
  availableEquipments = computed((): TypeObject[] => {
    if (!this.platform.value) return []
    return this.knownEquipments.value.filter(e => this.platform.value!.key in e.names!)
  })

  isElite = ref(false)

  name = ref('')

  upgradeFrom = ref(null as UnitDesign | null)
  upgradeFromDesigns = computed((): UnitDesign[] => {
    if (!this.player || !this.platform.value || !this.equipment.value) return []

    const tree: TypeObject[] = []
    upgradeTree(this.equipment.value as TypeObject, tree)
    upgradeTree(this.platform.value as TypeObject, tree)

    return this.player.designs.value.filter(
      d => tree.includes(d.equipment) || tree.includes(d.platform)
    )
  })

  pointCost = computed(() =>
    2 + (this.isElite.value ? 2 : 0) - (this.upgradeFrom.value ? 1 : 0)
  )

  constructor (player: Player | null = null, platform: TypeObject | null = null, equipment: TypeObject | null = null) {
    this.player = player
    this.platform.value = platform
    this.equipment.value = equipment

    watch(
      () => this.availablePlatforms.value.map(e => e.key).join(','),
      () => {
        if (this.availablePlatforms.value.length === 1) {
          this.platform.value = this.availablePlatforms.value[0]
          return
        }
        if (this.platform.value && !this.availablePlatforms.value.includes(this.platform.value as TypeObject)) {
          this.platform.value = null
        }
      }
    )

    watch(
      () => this.availableEquipments.value.map(e => e.key).join(','),
      () => {
        if (this.availableEquipments.value.length === 1) {
          this.equipment.value = this.availableEquipments.value[0]
          return
        }
        if (this.equipment.value && !this.availableEquipments.value.includes(this.equipment.value as TypeObject)) {
          this.equipment.value = null
        }
      }
    )

    watch([this.platform, this.equipment], () => {
      if (!this.platform.value || !this.equipment.value) {
        this.name.value = ''
        return
      }

      this.name.value = this.equipment.value.names![this.platform.value.key] ?? ''
    })

    watch(
      () => this.upgradeFromDesigns.value.map(e => e.key).join(','),
      () => {
        if (this.upgradeFrom.value && !this.upgradeFromDesigns.value.includes(this.upgradeFrom.value as any)) {
          this.upgradeFrom.value = null
        }
      }
    )
  }
}
