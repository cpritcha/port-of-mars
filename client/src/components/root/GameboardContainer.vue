<template>
  <div class="c-gameboard-container container">
    <ModalController/>
    <ProfileMenu/>
    <div class="system-health row">
      <SystemHealth/>
    </div>
    <div class="gameboard row">
      <div class="left col-9">
        <div class="hud row">
          <HUD/>
        </div>
        <div class="phase-switcher row">
          <PhaseSwitcher/>
        </div>
      </div>
      <div class="right col-3">
        <ChatMarsLog/>
      </div>
    </div>
    <b-modal body-bg-variant="dark" body-text-variant="warning" centered no-close-on-backdrop no-close-on-esc no-enforce-focus
             header-bg-variant="dark" header-border-variant="dark" header-text-variant="warning" hide-footer
             hide-header-close title="Timeout Warning: Impending Bot Takeover" v-model="botWarning"
             variant="outline-warning">
      <p>You have been inactive for at least four minutes. After five minutes a bot will takeover
        your player.</p>
      <b-button @click="resetBotWarning" block variant="warning">OK</b-button>
    </b-modal>
  </div>
</template>

<script lang="ts">
  import {Component, Inject, Vue} from 'vue-property-decorator';
  import ModalController from '@port-of-mars/client/components/game/modals/ModalController.vue';
  import HUD from '@port-of-mars/client/components/game/HUD.vue';
  import PhaseSwitcher from '@port-of-mars/client/components/game/PhaseSwitcher.vue';
  import ProfileMenu from '@port-of-mars/client/components/game/static/popups/ProfileMenu.vue';
  import SystemHealth
    from '@port-of-mars/client/components/game/static/systemhealth/SystemHealth.vue';
  import ChatMarsLog from '@port-of-mars/client/components/game/ChatMarsLog.vue';
  import {GameRequestAPI} from "@port-of-mars/client/api/game/request";

  @Component({
    components: {
      ModalController,
      HUD,
      PhaseSwitcher,
      ProfileMenu,
      SystemHealth,
      ChatMarsLog,
    },
  })
  export default class GameboardContainer extends Vue {
    @Inject()
    api!: GameRequestAPI;

    get botWarning() {
      return this.$tstore.getters.player.botWarning;
    }

    resetBotWarning() {
      this.api.resetBotWarning();
    }
  }
</script>

<style lang="scss" scoped>
  @import '@port-of-mars/client/stylesheets/root/GameboardContainer.scss';
</style>
