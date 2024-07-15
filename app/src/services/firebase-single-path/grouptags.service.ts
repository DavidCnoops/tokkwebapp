///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IGroupTag {
    $id?: string;
    tag_name: string;
    tag_slug: string;
    count: number;
  }

  interface IUpdatedGroupTag {
    count: number;
  }

  export class GroupTags {
    public stream: IFirebaseArrayStream<IGroupTag>;

    constructor(
      private $log: ng.ILogService,
      private $q: ng.IQService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {
      this.stream = null;
    }

    ref() {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/group_tags/`);
    }

    observe() {
      const ref = this.ref();
      this.stream = this.FirebaseUtils.arrayStream<IGroupTag>("grouptags", ref);
      return this.stream.observable;
    }

    updateCount(groupTagID: string, newCount: number) {
      if (newCount > 0) {
        return this.updateFirebase(groupTagID, { count: newCount });
      } else if (newCount <= 0) {
        return this.removeFromFirebase(groupTagID);
      }
    }

    find(tagSlug: string) {
      return _(this.stream.data).find((tag) => tag.tag_slug === tagSlug);
    }

    updateFirebase(groupTagID: string, object: IUpdatedGroupTag) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(groupTagID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateFirebase() of service GroupTags", error);
            reject();
          });
      });
    }

    removeFromFirebase(groupTagID: string) {
      return new this.$q((resolve, reject) => {
        this.ref()
          .child(groupTagID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for removeFromFirebase() of service GroupTags", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("GroupTags", GroupTags);
}
