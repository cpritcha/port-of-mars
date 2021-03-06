<template>
  <b-container class="container registration">
    <b-row class="p-3">
      <b-col>
        <h1>Port of Mars Consent Form and Email Registration</h1>
      </b-col>
    </b-row>
    <b-row>
      <Messages />
    </b-row>
    <b-row>
      <b-collapse id="consent-collapse" :visible="showConsentForm">
        <b-card>
          <b-card-text class="pr-2 consent-form-text">
            <p>Dear Participant,</p>
            <p>
              I am a professor in the School of Sustainability at Arizona State University.
              I am conducting experiments that investigate how people think, act, and make decisions.
              This research is part of the <a href='https://interplanetary.asu.edu/'>Interplanetary Initiative</a> at
              Arizona State University.
            </p>
            <p>
              I am requesting your participation in a tournament consisting of several rounds of games. Each game in
              the tournament will take no more than 60 minutes on average. The top ranking players in each round will
              qualify for the next round and will receive an email invitation to participate in another game on a
              later day. Your participation in this study is strictly voluntary and you may choose to not participate
              or to withdraw from the study at any time with no penalty; it will not affect your compensation for
              participation up to that point.
            </p>
            <p>
              <mark>You must be 18 or older and a current undergraduate student at Arizona State University to participate in the study.</mark>
            </p>
            <p>During the game you can chat with other participants. By signing this consent form, you consent to:</p>
            <ul>
              <li>Abstain from personal attacks or harassment</li>
              <li>Abstain from using profanity or offensive language when communicating with your fellow participants
              </li>
            </ul>
            <p>
              For participation in this study you may receive extra credit if you are in a class with a participating
              instructor. <mark>Those who qualify for the championship round will be invited to have lunch with Arizona State University's
              astronaut in residence, Catherine Coleman. The <em>winner</em> of the Mars Madness tournament will be eligible to create new
              personalized content for the next edition of Mars Madness.</mark>
            </p>
            <p>
              Society may benefit from this research because an understanding of how people make decisions can
              help us to design regulations that sustain the use of shared resources, in this experiment in a
              colony on Mars. You may benefit from this experience because you learn something about how an
              experiment is designed and conducted, what issues are of interest to social scientists and space
              research, and how your own cognitive abilities come into play in decision making situations.
              There are no foreseeable risks or discomforts to your participation.
            </p>
            <p>
              The results of the research study may be published, but your name will not be used. Your responses will
              be confidential. However, due to the group nature of this study, complete confidentiality cannot be
              guaranteed. If you are participating in this study as part of a class for extra credit, we may inform
              your instructor that you have participated, for example. We also have to keep track of which players
              will move on to next rounds. We will remove personal information such as your email address from our
              database after the tournament has been completed and ensure that only anonymized participant identifiers
              are associated with your experiment data.
            </p>
            <p>
              If you have any questions concerning the research study, please contact
              <a href="mailto:Marco.Janssen@asu.edu">Marco.Janssen@asu.edu</a>.
            </p>

            <p align="justify">Sincerely,</p>
            <p align="justify">Dr. Marco Janssen</p>
          </b-card-text>
        </b-card>
      </b-collapse>
      <b-button-group class="mt-2">
        <b-button variant="outline-success" @click="toggleConsent">{{ consentLabel }}</b-button>
        <b-button class="ml-2" variant="danger" @click="denyConsent">Deny Consent</b-button>
      </b-button-group>
    </b-row>
    <b-row class="py-5">
      <b-col class="p-0 m-0">
        <b-collapse v-model="consented">
          <b-form @submit="register">
            <b-alert v-if="existingUser" dismissible show variant="warning">It looks like you have logged in before!
              Please review the information below, and resend your verification email if you have not received it yet.
              Sometimes email can take a few minutes to arrive in your inbox and you may need to check your spam folder as well.
            </b-alert>
            <b-alert v-else dismissible show variant="success">Please fill out the fields below with your name and email
              so we can verify your email.
            </b-alert>
            <b-form-group description='Please enter your full name.' label='Name' label-for='name'>
              <b-form-input
                id='name'
                v-model='name'
                placeholder='Enter your full name'
                required
                size='lg'
                type='text'>
              </b-form-input>
            </b-form-group>
            <b-form-group description='We will only use your email to contact you for Port of Mars related activities and will never share your email.' label='Email'
                          label-for='email'>
              <b-form-input
                id='email'
                v-model='email'
                placeholder='Please enter a valid email address.'
                required
                size='lg'
                type='email'>
              </b-form-input>
            </b-form-group>
            <b-form-group description='Please verify your email.' label='Verify Email' label-for='verifyEmail'>
              <b-form-input
                id='verifyEmail'
                v-model='verifyEmail'
                placeholder='Please enter your email address again.'
                required
                size='lg'
                type='email'>
              </b-form-input>
            </b-form-group>
            <b-alert v-if="! isVerified" variant="warning">
              <b-icon icon="exclamation-triangle-fill" variant="danger"></b-icon>
              Please check your email and click on the link to verify your email.
            </b-alert>
            <b-button v-if="!existingUser" :disabled="submitDisabled" type="submit" variant="success">Grant Consent to
              Participate
            </b-button>
            <b-button v-else type="submit" :disabled="isVerificationDisabled" variant="warning">Resend verification email</b-button>
          </b-form>
        </b-collapse>
      </b-col>
    </b-row>
  </b-container>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {url} from "@port-of-mars/client/util";
import {DASHBOARD_PAGE} from '@port-of-mars/shared/routes';
import Messages from '@port-of-mars/client/components/dashboard/Messages.vue';
import _ from 'lodash';

@Component({
  components: { Messages }
})
export default class Register extends Vue {
  username = "";
  name = "";
  email = "";
  consented = false;
  verifyEmail = "";
  dateConsented: Date | null = null;
  isVerified = false;
  isVerificationDisabled = false;

  get messages() {
    return this.$tstore.state.dashboardMessages;
  }

  get existingUser() {
    return this.dateConsented !== null;
  }

  get showConsentForm() {
    return !this.consented;
  }

  get consentLabel() {
    return this.consented ? "Read Consent Form" : "Grant Consent and Register";
  }

  get emailsMatch(): boolean {
    return this.email === this.verifyEmail;
  }

  get submitDisabled() {
    return this.name.length === 0 || this.email.length === 0 || !this.emailsMatch;
  }

  get grantConsentUrl() {
    return url('/registration/grant-consent');
  }

  async created() {
    await this.$ajax.get(url('/registration/authenticated'), (response) => {
      if (response.data !== null) {
        const data = response.data;
        this.name = data.name;
        this.email = data.email;
        this.verifyEmail = data.email;
        this.isVerified = data.isVerified;
        if (data.dateConsented !== null) {
          this.dateConsented = new Date(Date.parse(data.dateConsented));
        }
        this.consented = false;
      }
    });
  }

  async register(e: Event) {
    e.preventDefault();
    if (this.emailsMatch && !_.isEmpty(this.email)) {
      const formData = {name: this.name, email: this.email};
      // temporarily disable verification
      this.isVerificationDisabled = true;
      this.dateConsented = new Date();
      await this.$ajax.post(this.grantConsentUrl, ({data, status}) => {
        if (status === 200) {
          this.$tstore.commit("SET_DASHBOARD_MESSAGE", {
            kind: "success",
            message: `We have sent an email to ${this.email}.
             Please wait for it to arrive then click on the link inside to verify your email.
             It may take some time to arrive, and you may need to check your spam folder as well.
             You can close this browser window as the link will take you back to Port of Mars again.`
          });
          // re-enable the re-send verification email button
          setTimeout(() => this.isVerificationDisabled = false, 20000);
        } 
      }, formData);

    }
  }

  toggleConsent() {
    this.consented = !this.consented;
  }

  denyConsent(): void {
    this.$ajax.denyConsent();
    this.$router.push({name: DASHBOARD_PAGE});
  }
}
</script>

<style lang="scss">
@import '@port-of-mars/client/stylesheets/views/Consent.scss';
</style>
