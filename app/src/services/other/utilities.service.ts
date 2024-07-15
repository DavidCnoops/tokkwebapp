///<reference path='../../../../typings/dependencies.d.ts' />
///<reference path='../../../../typings/app.d.ts' />

module app {
  "use strict";

  export interface IErrorObject {
    code: string;
    message: string;
  }

  export class Utilities {
    constructor(private $q: ng.IQService) {}

    generateFirebaseUUID() {
      const location = firebase.default.database().ref().push();
      return location.key;
    }

    generateUUID() {
      return uuid.v4();
    }

    deburr(text) {
      const basePropertyOf = (object) => {
        return (key) => {
          return object === null ? undefined : object[key];
        };
      };

      const deburredLetters = {
        // Latin-1 Supplement block.
        "\xc0": "A",
        "\xc1": "A",
        "\xc2": "A",
        "\xc3": "A",
        "\xc4": "A",
        "\xc5": "A",
        "\xe0": "a",
        "\xe1": "a",
        "\xe2": "a",
        "\xe3": "a",
        "\xe4": "a",
        "\xe5": "a",
        "\xc7": "C",
        "\xe7": "c",
        "\xd0": "D",
        "\xf0": "d",
        "\xc8": "E",
        "\xc9": "E",
        "\xca": "E",
        "\xcb": "E",
        "\xe8": "e",
        "\xe9": "e",
        "\xea": "e",
        "\xeb": "e",
        "\xcc": "I",
        "\xcd": "I",
        "\xce": "I",
        "\xcf": "I",
        "\xec": "i",
        "\xed": "i",
        "\xee": "i",
        "\xef": "i",
        "\xd1": "N",
        "\xf1": "n",
        "\xd2": "O",
        "\xd3": "O",
        "\xd4": "O",
        "\xd5": "O",
        "\xd6": "O",
        "\xd8": "O",
        "\xf2": "o",
        "\xf3": "o",
        "\xf4": "o",
        "\xf5": "o",
        "\xf6": "o",
        "\xf8": "o",
        "\xd9": "U",
        "\xda": "U",
        "\xdb": "U",
        "\xdc": "U",
        "\xf9": "u",
        "\xfa": "u",
        "\xfb": "u",
        "\xfc": "u",
        "\xdd": "Y",
        "\xfd": "y",
        "\xff": "y",
        "\xc6": "Ae",
        "\xe6": "ae",
        "\xde": "Th",
        "\xfe": "th",
        "\xdf": "ss",
        // Latin Extended-A block.
        "\u0100": "A",
        "\u0102": "A",
        "\u0104": "A",
        "\u0101": "a",
        "\u0103": "a",
        "\u0105": "a",
        "\u0106": "C",
        "\u0108": "C",
        "\u010a": "C",
        "\u010c": "C",
        "\u0107": "c",
        "\u0109": "c",
        "\u010b": "c",
        "\u010d": "c",
        "\u010e": "D",
        "\u0110": "D",
        "\u010f": "d",
        "\u0111": "d",
        "\u0112": "E",
        "\u0114": "E",
        "\u0116": "E",
        "\u0118": "E",
        "\u011a": "E",
        "\u0113": "e",
        "\u0115": "e",
        "\u0117": "e",
        "\u0119": "e",
        "\u011b": "e",
        "\u011c": "G",
        "\u011e": "G",
        "\u0120": "G",
        "\u0122": "G",
        "\u011d": "g",
        "\u011f": "g",
        "\u0121": "g",
        "\u0123": "g",
        "\u0124": "H",
        "\u0126": "H",
        "\u0125": "h",
        "\u0127": "h",
        "\u0128": "I",
        "\u012a": "I",
        "\u012c": "I",
        "\u012e": "I",
        "\u0130": "I",
        "\u0129": "i",
        "\u012b": "i",
        "\u012d": "i",
        "\u012f": "i",
        "\u0131": "i",
        "\u0134": "J",
        "\u0135": "j",
        "\u0136": "K",
        "\u0137": "k",
        "\u0138": "k",
        "\u0139": "L",
        "\u013b": "L",
        "\u013d": "L",
        "\u013f": "L",
        "\u0141": "L",
        "\u013a": "l",
        "\u013c": "l",
        "\u013e": "l",
        "\u0140": "l",
        "\u0142": "l",
        "\u0143": "N",
        "\u0145": "N",
        "\u0147": "N",
        "\u014a": "N",
        "\u0144": "n",
        "\u0146": "n",
        "\u0148": "n",
        "\u014b": "n",
        "\u014c": "O",
        "\u014e": "O",
        "\u0150": "O",
        "\u014d": "o",
        "\u014f": "o",
        "\u0151": "o",
        "\u0154": "R",
        "\u0156": "R",
        "\u0158": "R",
        "\u0155": "r",
        "\u0157": "r",
        "\u0159": "r",
        "\u015a": "S",
        "\u015c": "S",
        "\u015e": "S",
        "\u0160": "S",
        "\u015b": "s",
        "\u015d": "s",
        "\u015f": "s",
        "\u0161": "s",
        "\u0162": "T",
        "\u0164": "T",
        "\u0166": "T",
        "\u0163": "t",
        "\u0165": "t",
        "\u0167": "t",
        "\u0168": "U",
        "\u016a": "U",
        "\u016c": "U",
        "\u016e": "U",
        "\u0170": "U",
        "\u0172": "U",
        "\u0169": "u",
        "\u016b": "u",
        "\u016d": "u",
        "\u016f": "u",
        "\u0171": "u",
        "\u0173": "u",
        "\u0174": "W",
        "\u0175": "w",
        "\u0176": "Y",
        "\u0177": "y",
        "\u0178": "Y",
        "\u0179": "Z",
        "\u017b": "Z",
        "\u017d": "Z",
        "\u017a": "z",
        "\u017c": "z",
        "\u017e": "z",
        "\u0132": "IJ",
        "\u0133": "ij",
        "\u0152": "Oe",
        "\u0153": "oe",
        "\u0149": `'n`,
        "\u017f": "s",
      };

      const reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
      const rsComboMarksRange = "\\u0300-\\u036f\\ufe20-\\ufe23";
      const rsComboSymbolsRange = "\\u20d0-\\u20f0";
      const rsCombo = "[" + rsComboMarksRange + rsComboSymbolsRange + "]";
      const deburrLetter = basePropertyOf(deburredLetters);
      const reComboMark = RegExp(rsCombo, "g");

      text = _.toString(text);
      return text && text.replace(reLatin, deburrLetter).replace(reComboMark, "");
    }

    slugify(text: string): string {
      return this.deburr(_.trim(text)).toLowerCase().replace(/\s+/g, " ");
    }

    getFullName(userUID: string, list: Array<IUser>) {
      const firstName = _.find(list, (item) => item.$id === userUID).first_name;
      const lastName = _.find(list, (item) => item.$id === userUID).last_name;

      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }

      return "";
    }

    fuzzysearch(needle, haystack) {
      const hlen = haystack.length;
      const nlen = needle.length;

      if (nlen > hlen) {
        return false;
      }

      if (nlen === hlen) {
        return needle === haystack;
      }

      outer: for (let i = 0, j = 0; i < nlen; i++) {
        const nch = needle.charCodeAt(i);

        while (j < hlen) {
          if (haystack.charCodeAt(j++) === nch) {
            continue outer;
          }
        }

        return false;
      }

      return true;
    }

    validEmail(email: string) {
      const regex = /\S+@\S+/;
      return regex.test(email);
    }

    checkUserEmails(EmailsUsers: EmailsUsers, email: string) {
      return new this.$q((resolve, reject) => {
        EmailsUsers.getSingleOnce(email)
          .then((response) => {
            if (response) {
              reject({ code: "email-already-in-use" });
            } else {
              resolve();
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    }

    checkInvitedEmails(EmailsInvites: EmailsInvites, email: string) {
      return new this.$q((resolve, reject) => {
        EmailsInvites.getSingleOnce(email)
          .then((response) => {
            if (response) {
              reject({ code: "invitation-already-in-use" });
            } else {
              resolve();
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    }

    checkAllEmails(EmailsUsers: EmailsUsers, EmailsInvites: EmailsInvites, email: string) {
      return new this.$q((resolve, reject) => {
        this.$q
          .all([this.checkUserEmails(EmailsUsers, email), this.checkInvitedEmails(EmailsInvites, email)])
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    }

    unsubscribe(subscription: Rx.Subscription) {
      if (subscription) {
        subscription.unsubscribe();
      }
    }

    isValidEmail(email: string) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    getError(
      error:
        | "no-firstname"
        | "no-lastname"
        | "no-password"
        | "no-current-password"
        | "no-confirmation-password"
        | "no-new-password"
        | "weak-password"
        | "wrong-password"
        | "no-email"
        | "invalid-email"
        | "email-already-in-use"
        | "user-not-found"
        | "user-is-archived"
        | "invitation-already-in-use"
        | "invalid-action-code"
        | "no-invite-permission"
        | "invitation-limit-reached"
        | "passwords-no-match"
        | object
    ) {
      let code = "";
      let message = "";

      if (_.isString(error)) {
        code = error;
      } else if (_.has(error, "code") && _.isString(error["code"])) {
        code = error["code"];
      }

      // Note: some firebase error codes start with 'auth/'
      // remove it to standardize the error messages
      code = code.replace("auth/", "");

      switch (code) {
        case "no-firstname":
          message = `Please enter your first name`;
          break;

        case "no-lastname":
          message = `Please enter your last name`;
          break;

        case "no-password":
          message = "Please enter a password";
          break;

        case "no-current-password":
          message = "Please enter your password";
          break;

        case "no-confirmation-password":
          message = "Please enter your password to confirm the changes";
          break;

        case "no-new-password":
          message = "Please enter a new password";
          break;

        case "weak-password":
          message = "The password must be at least 6 characters long";
          break;

        case "wrong-password":
          message = "Wrong password";
          break;

        case "no-email":
          message = "Please enter an email address";
          break;

        case "invalid-email":
          message = "Invalid email address";
          break;

        case "email-already-in-use":
          message = "An account with this email address already exists";
          break;

        case "user-not-found":
          message = "No account found for the provided email address";
          break;

        case "user-is-archived":
          message = "Account is archived";
          break;

        case "invitation-already-in-use":
          message = "An invitation is already sent out to this email address";
          break;

        case "invalid-action-code":
          message = "Invalid password reset code";
          break;

        case "no-invite-permission":
          message = `You don't have the permission to invite someone`;
          break;

        case "invitation-limit-reached":
          message = `The maximum number of allowed invitations is reached`;
          break;

        case "passwords-no-match":
          message = `The new password does not match the confirmation password`;
          break;

        default:
          code = "unknown-error";
          message = "Something went wrong. Please try again.";
      }

      return <IErrorObject>{
        code,
        message,
      };
    }

    deepFreeze<T>(object: T): T {
      if (object) {
        let property;
        let propertyKey;

        object = Object.freeze(object);

        for (propertyKey in object) {
          if (object.hasOwnProperty(propertyKey)) {
            property = object[propertyKey];

            if (typeof property !== "object" || !(property instanceof Object) || Object.isFrozen(property)) {
              continue;
            }

            this.deepFreeze(property);
          }
        }
      }

      return object;
    }

    humanizeSeconds(inputSeconds: number) {
      let output = "";
      let hours_notation = "hour";
      let minutes_notation = "minute";
      let seconds_notation = "second";

      const hours = Math.floor(inputSeconds / 3600);
      const minutes = Math.floor((inputSeconds - hours * 3600) / 60);
      const seconds = inputSeconds - hours * 3600 - minutes * 60;

      if (hours > 1) {
        hours_notation += "s";
      }

      if (minutes > 1) {
        minutes_notation += "s";
      }

      if (seconds === 0 || seconds > 1) {
        seconds_notation += "s";
      }

      if (hours > 0) {
        if (minutes === 0) {
          output = hours + " " + hours_notation;
        } else {
          output = hours + " " + hours_notation + " " + minutes + " " + minutes_notation;
        }
      }

      if (hours === 0 && minutes > 0) {
        output = minutes + " " + minutes_notation;
      }

      if (hours === 0 && minutes === 0) {
        output = seconds + " " + seconds_notation;
      }

      return output;
    }

    secondsToHHMM(inputSeconds: number) {
      const hours: number = Math.floor(inputSeconds / 3600);
      const minutes: number = Math.floor((inputSeconds - hours * 3600) / 60);
      const hh: string = hours < 10 ? `0${hours}` : `${hours}`;
      const mm: string = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${hh}:${mm}`;
    }

    secondsToHHMMSS(inputSeconds: number) {
      const hours: number = Math.floor(inputSeconds / 3600);
      const minutes: number = Math.floor((inputSeconds - hours * 3600) / 60);
      const seconds: number = inputSeconds - hours * 3600 - minutes * 60;
      const hh: string = hours < 10 ? `0${hours}` : `${hours}`;
      const mm: string = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const ss: string = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return `${hh}:${mm}:${ss}`;
    }

    secondsToHHMMSSArray(inputSeconds: number) {
      const hours: number = Math.floor(inputSeconds / 3600);
      const minutes: number = Math.floor((inputSeconds - hours * 3600) / 60);
      const seconds: number = inputSeconds - hours * 3600 - minutes * 60;
      const hh: string = hours < 10 ? `0${hours}` : `${hours}`;
      const mm: string = minutes < 10 ? `0${minutes}` : `${minutes}`;
      const ss: string = seconds < 10 ? `0${seconds}` : `${seconds}`;
      return [hh, mm, ss];
    }

    setCaretAtEnd(element: HTMLInputElement) {
      if (element.setSelectionRange) {
        const valueProperty = element.tagName === "INPUT" ? "value" : "textContent";
        element.setSelectionRange(element[valueProperty].length, element[valueProperty].length);
      } else {
        const range = document.createRange();
        const selection = window.getSelection();
        element.focus();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    getContentEditableCaretPosition(element: any) {
      let caretPosition = 0;
      const doc = element.ownerDocument || element.document;
      const win = doc.defaultView || doc.parentWindow;
      let sel;

      if (_.isFunction(win.getSelection)) {
        sel = win.getSelection();

        if (sel.rangeCount > 0) {
          const range = win.getSelection().getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretPosition = preCaretRange.toString().length;
        }
      } else if ((sel = doc.selection) && sel.type !== "Control") {
        const textRange = sel.createRange();
        const preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretPosition = preCaretTextRange.text.length;
      }

      return caretPosition;
    }

    setContentEditableCaretPosition(element: any, position: number) {
      const range = document.createRange();
      const selection = window.getSelection();
      element.focus();
      range.setStart(element.childNodes[0], position);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  angular.module("app").service("Utilities", Utilities);
}
