import * as TutyUI from "./main";

(window as Window & { TutyUI?: typeof TutyUI }).TutyUI = TutyUI;
