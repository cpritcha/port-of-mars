import Vue, {VueConstructor} from 'vue'
import _ from "lodash";
import {VueRouter} from "vue-router/types/router";
import {TStore} from "@/plugins/tstore";

interface RoomListingData<Metadata = any> {
  clients: number;
  locked: boolean;
  private: boolean;
  maxClients: number;
  metadata: Metadata;
  name: string;
  processId: string;
  roomId: string;

  updateOne(operations: any): any;

  save(): any;

  remove(): any;
}

type Reservation = {
  room: RoomListingData<any>;
  sessionId: string;
}

declare module 'vue/types/vue' {
  interface Vue {
    $ajax: AjaxRequest;
  }
}

const LOGIN_CREDS = 'loginCreds';
const SUBMISSION_ID = 'submissionId';

interface LoginCreds {
  sessionCookie: string
  username: string
}

interface GameData {
  roomId: string;
  sessionId: string;
}

export class AjaxRequest {
  constructor(private router: VueRouter, private store: TStore) {
  }

  reservation!: Reservation;

  async setLoginCreds(response: Response) {
    const data: LoginCreds = await response.json();
    this.store.commit('SET_USER', {username: data.username});
  }

  get username(): string {
    return this.store.state.user.username;
  }

  setQuizCompletion(passedQuiz: boolean) {
    this.store.commit('SET_USER', {username: this.username, passedQuiz});
  }

  forgetLoginCreds() {
    document.cookie = "connect.sid= ;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    this.store.commit('SET_USER', {username: '', passedQuiz: false});
  }

  get submissionId(): number | null {
    const d = localStorage.getItem(SUBMISSION_ID);
    if (_.isNull(d)) return null;
    const data = parseInt(d!);
    if (isNaN(data)) return null;
    return data;
  }

  setSubmissionId(data: number) {
    localStorage.setItem(SUBMISSION_ID, JSON.stringify(data));
  }

  forgetSubmissionId() {
    localStorage.removeItem(SUBMISSION_ID);
  }

  async post(path: string, data?: any) {
    const response = await fetch(
      path,
      {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        redirect: 'follow',
        referrerPolicy: "no-referrer",
        body: JSON.stringify(data)
      }
    )
    switch (response.status) {
      case 401:
        this.router.push({name: 'Login'});
      default:
        return response;
    }
  }

  async get(path: string) {
    const response = await fetch(
      path,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: "no-referrer",
      }
    )
    switch (response.status) {
      case 401:
        this.router.push({name: 'Login'});
      default:
        return response;
    }
  }
}

export const Ajax = {
  install(instance: VueConstructor<Vue>, options: { router: VueRouter, store: TStore }) {
    instance.prototype.$ajax = new AjaxRequest(options.router, options.store);
  }
};
