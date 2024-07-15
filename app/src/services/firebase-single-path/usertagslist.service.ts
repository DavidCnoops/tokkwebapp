///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IUserTagsListItem {
    $id?: string;
    count?: number;
    tag_name: string;
    tag_slug: string;
  }

  export interface IUpdatedUserTagsListItem {
    count: number;
  }

  export class UserTagsList {
    constructor(
      private $q: ng.IQService,
      private $log: ng.ILogService,
      private Auth: Auth,
      private FirebaseUtils: FirebaseUtils
    ) {}

    ref(userUID: string) {
      return firebase.default.database().ref(`group/${this.Auth.userGroup}/user/${userUID}/user_tags_list/`);
    }

    observe(userUID: string | boolean = false) {
      const refUserUID = !_.isString(userUID) ? this.Auth.userUID : userUID;
      const ref = this.ref(refUserUID);
      return this.FirebaseUtils.arrayStream<IUserTagsListItem>("usertagslist", ref).observable;
    }

    add(userUID: string, newListItem: IUserTagsListItem) {
      return this.findTag(userUID, newListItem.tag_slug).then((existingListItem) => {
        if (existingListItem) {
          return this.updateFirebase(userUID, existingListItem.$id, { count: existingListItem.count + 1 });
        }

        return this.addToFirebase(userUID, newListItem);
      });
    }

    remove(userUID: string, tagSlug: string) {
      this.findTag(userUID, tagSlug).then((existingListItem) => {
        if (existingListItem) {
          if (existingListItem.count > 1) {
            return this.updateFirebase(userUID, existingListItem.$id, { count: existingListItem.count - 1 });
          } else {
            this.removeFromFirebase(userUID, existingListItem.$id);
          }
        }
      });
    }

    updateCount(userUID: string, userTagID: string, newCount: number) {
      if (newCount > 0) {
        return this.updateFirebase(userUID, userTagID, { count: newCount });
      }

      return this.removeFromFirebase(userUID, userTagID);
    }

    private findTag(userUID: string, tagSlug: string): angular.IPromise<IUserTagsListItem> {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .orderByChild("tag_slug")
          .equalTo(tagSlug)
          .limitToFirst(1)
          .once("value", (snapshot) => {
            let listItem = null;

            if (snapshot.exists()) {
              snapshot.forEach((childSnapshot) => {
                listItem = childSnapshot.val();
                listItem.$id = childSnapshot.key;
                return false;
              });
            }

            resolve(listItem);
          });
      });
    }

    private removeFromFirebase(userUID: string, listItemID: string) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .child(listItemID)
          .remove()
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error on callback for removeFromFirebase() of service UserTagsList", error);
            reject();
          });
      });
    }

    private updateFirebase(userUID: string, listItemID: string, object: IUpdatedUserTagsListItem) {
      return new this.$q((resolve, reject) => {
        this.ref(userUID)
          .child(listItemID)
          .update(object)
          .then(resolve)
          .catch((error) => {
            this.$log.error("Error for updateFirebase() of service UserTagsList", error);
            reject();
          });
      });
    }

    private addToFirebase(userUID: string, listItem: IUserTagsListItem) {
      return new this.$q((resolve, reject) => {
        const newListItem: IUserTagsListItem = {
          count: 1,
          tag_name: listItem.tag_name,
          tag_slug: listItem.tag_slug,
        };

        this.ref(userUID)
          .push(newListItem)
          .then(resolve, (error) => {
            this.$log.error("Error on callback for addToFirebase() of service UserTagsList", error);
            reject();
          });
      });
    }
  }

  angular.module("app").service("UserTagsList", UserTagsList);
}
