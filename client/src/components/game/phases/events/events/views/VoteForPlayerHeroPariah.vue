<template>
  <transition-group name="fade" mode="out-in">
    <!-- VOTE :: hero or pariah -->
    <div class="event-vote-for-player-hero-pariah" v-if="!decidedHeroOrPariah" :key="!decidedHeroOrPariah">
      <p class="title m-4">Select Hero or Pariah</p>
      <b-form>
        <b-form-radio-group
          :options="options"
          :value="voteHeroOrPariah"
          @change="submitHeroOrPariah"
          button-variant="outline-warning"
          buttons
          size="lg"
        >
        </b-form-radio-group>
      </b-form>
      <p class="voted m-4" v-if="!decidedHeroOrPariah && voteHeroOrPariah">You voted for a <strong>{{ voteHeroOrPariah
        }}</strong>.</p>
      <b-spinner label="small spinner" small v-if="!decidedHeroOrPariah && voteHeroOrPariah"/>
      <p class="voted m-2" v-if="!decidedHeroOrPariah && voteHeroOrPariah">Processing votes... </p>
    </div>

    <div class="event-vote-for-player-hero-pariah" v-if="decidedHeroOrPariah" :key="decidedHeroOrPariah">
      <!-- VOTE :: player to be hero or pariah -->
      <p class="title">Select a {{ decidedHeroOrPariah }}</p>

      <!-- vote for player -->
      <div class="m-4">
        <div class="player-frame-container">
          <div
            :key="player"
            class="player-frame"
            v-bind:class="{ 'selected-background': player === role }"
            v-for="player in roles"
          >
            <img
              :src="require(`@port-of-mars/client/assets/characters/${player}.png`)"
              @click="selectRole(player)"
              alt="Player"
            />
          </div>
        </div>
        <p class="voted m-5" v-if="!role">No player selected.</p>
        <p class="voted m-5" v-else><strong>{{ role }}</strong></p>
      </div>
    </div>


  </transition-group>
</template>

<script lang="ts">
  import {Component, Inject, Vue} from 'vue-property-decorator';
  import {Role, ROLES} from '@port-of-mars/shared/types';
  import {GameRequestAPI} from '@port-of-mars/client/api/game/request';

  @Component({})
  export default class VoteForPlayerHeroPariah extends Vue {
    @Inject() api!: GameRequestAPI;
    voteHeroOrPariah: 'hero' | 'pariah' | '' = '';
    role: Role | '' = '';

    options = [
      {text: 'Hero', value: 'hero'},
      {text: 'Pariah', value: 'pariah'}
    ]

    get decidedHeroOrPariah() {
      return this.$tstore.getters.heroOrPariah;
    }

    get roles(): Array<Role> {
      return ROLES;
    }

    private submitHeroOrPariah(vote: 'hero' | 'pariah') {
      this.voteHeroOrPariah = vote;
      if (this.voteHeroOrPariah) {
        this.api.saveHeroOrPariah(this.voteHeroOrPariah);
      }
    }

    private selectRole(member: Role): void {
      this.role = member;
      console.log('Hero or Pariah - Role Vote: ', this.role)
      this.api.saveHeroOrPariahRole(this.role);
    }

  }
</script>

<style lang="scss" scoped>
  @import '@port-of-mars/client/stylesheets/game/phases/events/events/views/VoteForPlayerHeroPariah.scss';
</style>
