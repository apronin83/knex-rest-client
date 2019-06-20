import Vue from "vue";

const actions = {
  login({ commit }, credential) {
    commit("loginWait", true);

    console.log("Start Login: " + JSON.stringify(credential));

    return new Promise(resolve => {
      //Vue.http.headers.common['Access-Control-Allow-Origin'] = '*';
      //Vue.http.headers.common['Access-Control-Allow-Methods'] = 'POST, GET, PUT, OPTIONS, DELETE';
      //Vue.http.headers.common['Access-Control-Allow-Headers'] = 'Access-Control-Allow-Methods, Access-Control-Allow-Origin, Origin, Accept, Content-Type';

      Vue.http
        .post("auth/login", credential)
        .then(response => response.json())
        .then(result => {
          console.log("Res: " + JSON.stringify(result));

          commit("login", result);
          resolve();
        })
        .catch(() => {
          commit("loginWait", false);
          commit("loginFailed");
        });
    });
  },
  logout({ commit }) {
    return new Promise(resolve => {
      Vue.http
        .get("auth/logout")
        .then(response => response.json())
        .then(() => {
          commit("logout");
          resolve();
        });
    });
  },
  getUser({ commit }) {
    return new Promise(resolve => {
      Vue.http
        .get("auth/user")
        .then(response => response.json())
        .then(response => {
          if ([400, 401, 403].includes(response.status)) {
            commit("logout");
          }
          resolve();
        });
    });
  },
  refreshToken({ commit }, data) {
    Vue.http
      .post("auth/refresh-token")
      .then(response => response.json())
      .then(result => {
        commit("refreshToken", result);
      });
  },
  editUser({ commit, dispatch }, data) {
    Vue.http.post("auth/user", data).then(
      response => {
        let result = response.json();
        commit("editUser", result);
      },
      error => {
        dispatch("openAlertBox", ["alertError", error.statusText], {
          root: true
        });
      }
    );
  },
  editPassword({ commit, dispatch }, data) {
    Vue.http.post("auth/user-password", data).then(
      response => {
        let result = response.json();
        commit("editPassword", result);
      },
      error => {
        dispatch("openAlertBox", ["alertError", error.statusText], {
          root: true
        });
      }
    );
  }
};

export default actions;
