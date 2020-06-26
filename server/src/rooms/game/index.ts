import http from "http";
import { Client, Room } from 'colyseus';
import {
  AcceptTradeRequestCmd,
  BondingThroughAdversityCmd,
  BreakdownOfTrustCmd,
  CancelTradeRequestCmd,
  DiscardAccomplishmentCmd,
  OutOfCommissionCuratorCmd,
  OutOfCommissionEntrepreneurCmd,
  OutOfCommissionPioneerCmd,
  OutOfCommissionPoliticianCmd,
  OutOfCommissionResearcherCmd,
  PersonalGainVotes,
  PurchaseAccomplishmentCmd,
  RejectTradeRequestCmd,
  ResetGameCmd,
  SendChatMessageCmd,
  SendTradeRequestCmd,
  SetNextPhaseCmd,
  SetPlayerReadinessCmd,
  TimeInvestmentCmd,
  VoteForPhilanthropistCmd
} from '@port-of-mars/server/rooms/game/commands';
import { User } from "@port-of-mars/server/entity";
import { Command } from '@port-of-mars/server/rooms/game/commands/types';
import { TakenStateSnapshot } from '@port-of-mars/server/rooms/game/events';
import { GameState, Player } from '@port-of-mars/server/rooms/game/state';
import {Game, GameOpts, Metadata, Persister} from '@port-of-mars/server/rooms/game/types';
import { getServices } from "@port-of-mars/server/services";
import { settings } from "@port-of-mars/server/settings";
import { Requests, Responses } from '@port-of-mars/shared/game';
import {Phase, ROLES} from "@port-of-mars/shared/types";
import {GameEvent} from "@port-of-mars/server/rooms/game/events/types";
import _ from "lodash";
import {DBPersister} from "@port-of-mars/server/services/persistence";
import {buildGameOpts} from "@port-of-mars/server/util";
import {uuid} from "uuidv4";

const logger = settings.logging.getLogger(__filename);

type GameRoomType = Room<GameState> & Game & {persister: Persister; getMetadata(): Metadata; gameId: number};

function gameLoop(room: GameRoomType): void {
  const inEndGame = [Phase.defeat, Phase.victory].includes(room.state.phase);
  room.state.timeRemaining -= 1;
  let events: Array<GameEvent>;
  const botEvents = room.state.act();
  if (botEvents.length > 0) {
    logger.debug('bot events: %o', botEvents)
  }

  if (room.state.allPlayersAreReady
    || room.state.timeRemaining <= 0
    || (room.state.upkeep <= 0 && !inEndGame)) {
    const cmd = new SetNextPhaseCmd(room.state);
    const phaseEvents = cmd.execute();
    room.state.applyMany(phaseEvents);
    events = botEvents.concat(phaseEvents);
  } else {
    events = botEvents;
  }

  if (!_.isEmpty(events)) {
    room.persister.persist(events, room.getMetadata());
  }

  if (inEndGame) {
    room.disconnect()
  }
}

function prepareRequest(room: Room<GameState> & Game, r: Requests, client: Client): Command {
  logger.trace('prepareRequest from', client.id, ':', { r });
  const player = room.getPlayer(client);
  player.resetElapsed();
  switch (r.kind) {
    case 'send-chat-message':
      return SendChatMessageCmd.fromReq(r, room.state, player);
    case 'set-next-phase':
      return SetNextPhaseCmd.fromReq(room.state);
    case 'set-player-readiness':
      return SetPlayerReadinessCmd.fromReq(r, player);
    case 'reset-game':
      return ResetGameCmd.fromReq(r, room.state);
    case 'set-time-investment':
      return TimeInvestmentCmd.fromReq(r, player);
    case 'purchase-accomplishment-card':
      return PurchaseAccomplishmentCmd.fromReq(r, player);
    case 'discard-accomplishment-card':
      return DiscardAccomplishmentCmd.fromReq(r, player);
    case 'accept-trade-request':
      return AcceptTradeRequestCmd.fromReq(r);
    case 'reject-trade-request':
      return RejectTradeRequestCmd.fromReq(r);
    case 'cancel-trade-request':
      return CancelTradeRequestCmd.fromReq(r, player);
    case 'send-trade-request':
      return SendTradeRequestCmd.fromReq(r, player);
    case 'personal-gain':
      return PersonalGainVotes.fromReq(r);
    case 'vote-for-philanthropist':
      return VoteForPhilanthropistCmd.fromReq(r, player);
    case 'out-of-commission-curator':
      return OutOfCommissionCuratorCmd.fromReq(r, player);
    case 'out-of-commission-politician':
      return OutOfCommissionPoliticianCmd.fromReq(r, player);
    case 'out-of-commission-researcher':
      return OutOfCommissionResearcherCmd.fromReq(r, player);
    case 'out-of-commission-pioneer':
      return OutOfCommissionPioneerCmd.fromReq(r, player);
    case 'out-of-commission-entrepreneur':
      return OutOfCommissionEntrepreneurCmd.fromReq(r, player);
    case 'bonding-through-adversity':
      return BondingThroughAdversityCmd.fromReq(r, player);
    case 'breakdown-of-trust':
      return BreakdownOfTrustCmd.fromReq(r, player);
  }
}

async function onCreate(room: GameRoomType, options?: GameOpts): Promise<void> {
  options = options ?? await buildGameOpts();
  room.setState(new GameState(options));
  room.setPrivate(true);
  room.onMessage('*', (client, type, message) => {
    // we can refactor this.prepareRequest to not run a billion long switch statement and instead have
    // lots of small onMessages coupled with Commands that modify the state (within the Command itself, not here)
    // something like this:
    /*
    this.onMessage('send-chat-message', (client, message) => {
      this.dispatcher.dispatch(
        new SendChatMessageCommand({ player: this.getPlayer(client), message });
      );
    });

    SendChatMessageCommand extends BaseCommand<GameState, { player: Player, message: SendChatMessageData }> {
      execute({player, message}) {
        return [new SentChatMessage({
          message: this.message,
          dateCreated: new Date().getTime(),
          role: this.player.role,
          round: this.state.round
        })];
      }
    }
    */
    const cmd = prepareRequest(room, message, client);
    const events = cmd.execute();
    room.state.applyMany(events);
    room.persister.persist(events, room.getMetadata());
  });
  room.persister = new DBPersister();
  room.gameId = await room.persister.initialize(options, room.roomId);
  const snapshot = room.state.toJSON();
  const event = new TakenStateSnapshot(snapshot);
  room.persister.persist([event], room.getMetadata());
  room.clock.setInterval(() => gameLoop(room), 1000);
  room.clock.setInterval(async () => await room.persister.sync(), 5000);
}

export class LoadTestGameRoom extends Room<GameState> implements Game {
  maxClients = 5;
  persister!: Persister;
  gameId!: number;

  async onCreate() {
    const options = await buildGameOpts();
    await onCreate(this, options);
  }

  onJoin(client: Client): void | Promise<any> {
    const roles = _.difference(ROLES, Object.values(this.state.userRoles));
    if (roles.length === 0) {
      logger.fatal('no available roles');
    }
    this.state.userRoles[client.id] = roles[0];
  }

  getMetadata(): Metadata {
    return {
      gameId: this.gameId,
      dateCreated: new Date(),
      timeRemaining: this.state.timeRemaining
    }
  }

  safeSend(client: Client, msg: Responses) {
    client.send(msg.kind, msg);
  }

  getPlayer(client: Client): Player {
    return this.state.getPlayer(client.id);
  }
}

export class GameRoom extends Room<GameState> implements Game {
  public static get NAME(): string { return 'port_of_mars_game_room' }
  autoDispose = false;
  persister!: Persister;
  gameId!: number;

  async onAuth(client: Client, options: any, request: http.IncomingMessage) {
    try {
      logger.debug(`GameRoom.onAuth: checking client ${client.id} in ${this.roomId}`);
      const userId = (request as any).session.passport.user;
      const user = await getServices().account.findUserById(userId);
      if (user) {
        const username = user.username;
        logger.debug(`GameRoom.onAuth found user ${username}`);
        if (this.state.hasUser(username)) {
          return user;
        }
      }
      logger.debug(`GameRoom.onAuth: ${userId} not found or does not belong to this GameRoom`);
      return false;
    }
    catch (e) {
      logger.fatal(`GameRoom.onAuth exception: ${e}`);
      return false;
    }
  }

  async onCreate(options: GameOpts): Promise<void> {
    await onCreate(this, options);
  }

  safeSend(client: Client, msg: Responses) {
    client.send(msg.kind, msg);
  }

  getMetadata(): Metadata {
    return {
      gameId: this.gameId,
      dateCreated: new Date(),
      timeRemaining: this.state.timeRemaining
    }
  }

  getPlayer(client: Client): Player {
    return this.state.getPlayer(client.auth.username);
  }

  onJoin(client: Client, options: any, auth: User): void {
    logger.info(`client ${client.id} joined game ${this.roomId} ${auth}`);
    const player = this.getPlayer(client);
    this.safeSend(client, { kind: 'set-player-role', role: player.role });
  }

  async onDispose(): Promise<void> {
    logger.info('Disposing of room', this.roomId);
    await this.persister.sync();
    await this.persister.finalize(this.gameId);
    logger.info('Disposed of room', this.roomId);
  }

}
