<template>
  <div class="c-gameinformation">
    <div class="section tour-round">
      <p class="title">Round</p>
      <p class="round">{{ roundNumber }}</p>
    </div>
    <div class="section tour-current-phase">
      <p class="title">Current Phase</p>
      <p class="number">{{ phaseNumber + 1 }} of 6</p>
      <p class="phase">{{ phaseText }}</p>
    </div>
    <div class="section tour-time-remaining">
      <p class="title">Phase Countdown</p>
      <p :class="countdownStyling">{{ timeRemaining }}</p>
    </div>
    <div class="section">
      <button
        @click="submitDone"
        class="ready-button tour-ready-to-advance-button"
        v-if="!playerReady"
      >
        Ready to Advance
      </button>
      <button @click="submitCancel" v-if="playerReady" class="cancel-button">
        Cancel Readiness
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Inject } from 'vue-property-decorator';
import { Phase, PHASE_LABELS } from '@port-of-mars/shared/types';
import {AbstractGameAPI} from "@port-of-mars/client/api/game/types";

@Component({
  components: {},
})
export default class GameInformation extends Vue {
  @Inject() private api!: AbstractGameAPI;

  get roundNumber() {
    const { round, systemHealth } = this.$tstore.state;
    if (round > 0 && systemHealth > 0) {
      return round;
    } else if (systemHealth <= 0) {
      return 'Over';
    } else {
      return 'Pregame';
    }
  }

  get phaseNumber(): Phase {
    const phaseNumber = this.$tstore.state.phase;
    return phaseNumber ? phaseNumber : 0;
  }

  get phaseText() {
    return this.phaseNumber !== Phase.events
      ? PHASE_LABELS[this.phaseNumber]
      : `Event ${this.$tstore.state.marsEventsProcessed + 1}`;
  }

  get playerReady() {
    return this.$tstore.getters.player.ready;
  }

  get timeRemaining() {
    const fromState = this.$tstore.state.timeRemaining;
    const minutesRemaining = Math.floor(fromState / 60);
    const minutesRemainingDisplay = `${minutesRemaining}`.padStart(2, '0');
    const secondsRemainingDisplay = `${
      fromState - minutesRemaining * 60
    }`.padStart(2, '0');
    const timeRemaining = `${minutesRemainingDisplay}:${secondsRemainingDisplay}`;
    return timeRemaining ? timeRemaining : '00:00';
  }

  get countdownStyling() {
    return this.$tstore.state.timeRemaining < 60 ? 'blink-timer' : 'countdown';
  }

  private submitDone() {
    let pendingInvestments;

    switch (this.phaseNumber) {
      // FIXME: change to using a queue system where other components can push pending api calls to
      //  queue. Submitting would flush the queue
      case Phase.events:
        const currentEvent = this.$tstore.getters.currentEvent;
        pendingInvestments = this.$tstore.getters.player.pendingInvestments;
        if (currentEvent && currentEvent.id === 'breakdownOfTrust') {
          this.api.saveBreakdownOfTrust(pendingInvestments);
        }
      case Phase.invest:
        pendingInvestments = this.$tstore.getters.player.pendingInvestments;
        this.api.investTimeBlocks(pendingInvestments);
      default:
        this.api.setPlayerReadiness(true);
    }
  }

  private submitCancel() {
    this.api.setPlayerReadiness(false);
  }
}
</script>

<style lang="scss" scoped>
@import '@port-of-mars/client/stylesheets/game/static/panels/GameInformation.scss';
</style>
