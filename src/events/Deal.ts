import { PohEvent } from "@/events/_Event";
import { Player } from "@/objects/game/Player";
import { Deal } from "@/objects/game/Deal";

export class DealAccepted extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("accepted a deal");

    this.subject = deal;
    this.player = deal.toPlayer.value;
  }
}

export class DealCancelled extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("cancelled a deal");

    this.subject = deal;
    this.player = deal.toPlayer.value;
  }
}

export class DealDeclined extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("declined a deal");

    this.subject = deal;
    this.player = deal.toPlayer.value;
  }
}

export class DealEnded extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("deal ended");

    this.subject = deal;
    this.player = deal.fromPlayer.value;
  }
}

export class DealEnding extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("a deal about to end");

    this.subject = deal;
    this.player = deal.fromPlayer.value;
  }
}

export class DealProposed extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("proposed a deal");

    this.subject = deal;
    this.player = deal.fromPlayer.value;
  }
}

export class DealRefused extends PohEvent {
  subject: Deal;
  player: Player;

  constructor(deal: Deal) {
    super("refused a deal");

    this.subject = deal;
    this.player = deal.toPlayer.value;
  }
}
