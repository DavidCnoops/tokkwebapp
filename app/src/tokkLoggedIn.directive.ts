///<reference path='../../typings/dependencies.d.ts' />
///<reference path='../../typings/app.d.ts' />

module app {
  "use strict";

  const styles = require("tokkLoggedin.css");

  // Note: don't place template in separate templateUrl. Will break app on page refresh!

  function tokkLoggedin() {
    return {
      scope: {},
      bindToController: {},
      restrict: "E",
      template: `
                <div class="{{::vm.styles.container}}" ng-class="{'{{::vm.styles.safari}}': vm.isDesktopSafari}">
                    <div class="{{::vm.styles.loading}}" ng-if="!vm.loaded">
                        <tokk-spinner size="26px" color="#333" thickness="3px"></tokk-spinner>
                    </div>

                    <div ng-if="vm.loaded">
                        <tokk-menu></tokk-menu>
                        <ui-view></ui-view>
                    </div>
                </div>
            `,
      controller: LoggedinController,
      controllerAs: "vm",
    };
  }

  class LoggedinController {
    public styles: any;
    public loaded: boolean;
    public visible: boolean;
    public isDesktopSafari: boolean;
    public prefetchRef: firebase.default.database.Reference;
    public subscriptions: Array<Rx.Subscription>;

    constructor(
      private $state: ng.ui.IStateService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private Users: Users,
      private UserProjectsList: UserProjectsList,
      private Notifications: Notifications,
      private UserStatus: UserStatus,
      private GroupProjects: GroupProjects,
      private GroupTasks: GroupTasks,
      private GroupTags: GroupTags,
      private GroupSubscription: GroupSubscription,
      private GroupMetaData: GroupMetaData,
      private GroupInvitations: GroupInvitations,
      private BillingInformation: BillingInformation,
      private Data: Data,
      private Today: Today,
      private Day: Day,
      private ReportsList: ReportsList,
      private FilterCollections: FilterCollections,
      private Entries: Entries
    ) {}

    $onInit() {
      this.styles = styles;
      this.loaded = false;
      this.visible = false;
      this.isDesktopSafari = bowser.safari && bowser.mac;
      this.prefetchRef = null;
      this.subscriptions = [];

      this.Auth.asyncCheckAuthentication()
        .then(({ user_uid: userUID, user_group: groupID }) => {
          this.loaded = true;

          if (!this.prefetchRef) {
            this.prefetchRef = firebase.default.database().ref(`group/${groupID}/user/${userUID}/user_projects/`);
            this.prefetchRef.on("value", () => null);
          }

          this.subscriptions = [
            this.Users.observe().subscribe(),
            this.UserProjectsList.observe().subscribe(),
            this.Notifications.observe().subscribe(),
            this.GroupProjects.observe().subscribe(),
            this.GroupTasks.observe().subscribe(),
            this.GroupTags.observe().subscribe(),
            this.GroupMetaData.observe().subscribe(),
            this.GroupInvitations.observe().subscribe(),
            this.BillingInformation.observe().subscribe(),
            this.ReportsList.observe().subscribe(),
            this.FilterCollections.observe().subscribe(),
            this.Entries.observe(userUID).subscribe(),

            this.UserStatus.observe()
              .filter((status) => status !== "active")
              .subscribe((x) => {
                this.Auth.unAuth(true);
              }),

            this.GroupSubscription.observe(this.Auth.userGroup)
              .filter((subscription) => !this.GroupSubscription.isValid(subscription))
              .subscribe(() => {
                this.Auth.unAuth(true);
              }),

            Rx.Observable.fromEvent(document, "visibilitychange").subscribe(() => {
              if (document.visibilityState === "visible") {
                const timezone = moment.tz.guess();
                const isoDate = moment().tz(timezone).format("YYYY-MM-DD");

                if (timezone !== this.Today.timezone || isoDate !== this.Today.isoDate) {
                  this.Today.set(isoDate, timezone);
                  this.Data.pauseActiveEntriesBeforeToday(userUID, groupID, isoDate);
                } else {
                  this.Day.updateActiveEntrySeconds(this.Today.isoDate);
                }
              }
            }),
          ];

          const timezone = moment.tz.guess();
          const isoDate = moment().tz(timezone).format("YYYY-MM-DD");
          this.Today.set(isoDate, timezone);
          this.Data.pauseActiveEntriesBeforeToday(userUID, groupID, isoDate);
        })
        .catch((error) => {
          this.$log.error("Error for tokkLoggedIn component", error);
          this.$state.go("login");
        });
    }

    $onDestroy() {
      if (this.prefetchRef) {
        this.prefetchRef.off();
        this.prefetchRef = null;
      }

      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
  }

  angular.module("app").directive("tokkLoggedin", tokkLoggedin);
}
