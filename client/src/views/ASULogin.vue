<template>
  <div class="login">
    <div class="wrapper">
      <div class="text">
        <h1>Port of Mars</h1>
        <h2>Sign In</h2>
      </div>
      <div class="submit" v-if="isLoggedIn">
        <input type="button" @click="logout" :value="logoutText" />
      </div>
      <form class="login-form" v-else>
        <div class="submit">
          <input
            type="submit"
            @click="login"
            value="Login"
          />
        </div>
        <p class="error" v-if="error">
          {{ error }}
        </p>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import {DASHBOARD_PAGE, GAME_PAGE, LOBBY_PAGE, LOGIN_PAGE} from '@port-of-mars/shared/routes';
import {url} from "@port-of-mars/client/util";

@Component({})
export default class Login extends Vue {
  username: string = '';
  isLoggedIn: boolean = false;
  error: string = '';

  created() {
    this.isLoggedIn = !!this.$ajax.username;
  }

  get logoutText() {
    return `Logout (${this.$tstore.state.user.username})`;
  }

  logout() {
    this.$ajax.forgetLoginCreds();
    this.$ajax.forgetSubmissionId();
    this.isLoggedIn = false;
  }

  async login(e: Event) {
    e.preventDefault();
    window.location.href = url('/asulogin');
  }

  get loginUrl() {
    return url(`/login`);
  }
}
</script>

<style lang="scss" scoped>
@import '@port-of-mars/client/stylesheets/views/ASULogin.scss';
</style>
