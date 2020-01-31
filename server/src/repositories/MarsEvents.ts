import * as _ from 'lodash';
import {
  MarsEventData,
  MarsEventDataDeckItem,
  Role,
  ROLES,
  CURATOR,
  ENTREPRENEUR,
  PIONEER,
  POLITICIAN,
  RESEARCHER
} from 'shared/types';
import { MarsEvent, GameState } from '@/game/state';
import { Schema } from '@colyseus/schema';

export function getAllMarsEvents() {
  return marsEvents;
}

const expandCopies = (marsEventsCollection: Array<MarsEvent>) =>
  _.flatMap(marsEventsCollection, (event: MarsEvent) => {
    const copies = event.data.copies;
    return _.map(_.range(copies), i => _.cloneDeep(event));
  });

const enumerate = (mes: Array<Omit<MarsEventData, 'id'>>) =>
  _.map(mes, (x: Omit<MarsEventData, 'id'>, id: number) => ({ ...x, id }));

class PersonalGain extends Schema implements MarsEvent {
  private static data: MarsEventDataDeckItem = {
    id: 0,
    name: 'Personal Gain',
    copies: 5,
    effect: `Each player secretly chooses Yes or No. Then, simultaneously, players reveal their choice. Players who chose yes gain 6 extra Time Blocks this round, but destroy 6 Upkeep.`,
    flavorText: `It's easy to take risks when others are incurring the costs.`,
    serverActionHandler: undefined,
    clientViewHandler: 'VOTE_YES_NO' as const,
    clientActionHandler: undefined,
    duration: 1
  };

  private static defaultResponse: boolean = true;

  private votes: { [role in Role]: boolean } = {
    [CURATOR]: PersonalGain.defaultResponse,
    [ENTREPRENEUR]: PersonalGain.defaultResponse,
    [PIONEER]: PersonalGain.defaultResponse,
    [POLITICIAN]: PersonalGain.defaultResponse,
    [RESEARCHER]: PersonalGain.defaultResponse
  };

  toJSON() {
    return {};
  }

  fromJSON(json: object) {
    return new PersonalGain();
  }

  finalize(game: GameState) {
    let subtractedUpkeep = 0;
    for (const role of ROLES) {
      if (this.votes[role]) {
        game.players[role].timeBlocks += 6;
        subtractedUpkeep += 6;
      }
    }
    game.subtractUpkeep(subtractedUpkeep);
    // create new MarsLogMessage
    // game.logs.push(message)
  }
}

class MarsEventsDeck {
  deck: Array<MarsEvent>;

  constructor() {
    this.deck = expandCopies(getAllMarsEvents());
  }

  // parse JSON string into object
  fromJSON() {
    Object.assign(this, this.deck);
  }

  // convert objects to JSON string
  toJSON() {}

  updatePosition(cardsUsed: number): void {}


  public peek(upkeep: number): Array<MarsEvent> | undefined {
    return undefined;
  }

  public drawAmount(amount: number): Array<MarsEvent> | undefined {
    
    return undefined;
  }
}

const marsEvents = [new PersonalGain()];

export { PersonalGain, MarsEventsDeck };
