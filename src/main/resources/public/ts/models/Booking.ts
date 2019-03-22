import {Eventer, Mix, Selectable, Selection} from "entcore-toolkit";
import {moment, _, notify} from "entcore";
import http from "axios";
import {STATE_CREATED, STATE_REFUSED, STATE_VALIDATED} from "./constantes/STATE";
import {Resource, Slot} from './models/index';
export class Booking implements Selectable {
    selected :boolean;
    id:number;
    created: string;
    days: string | null;
    periodDays;
    end_date: string;
    is_periodic: boolean;
    moderator_id: string;
    moderator_name: string;
    modified: string;
    occurrences: number | null;
    owner: string;
    owner_name: string;
    parent_booking_id: number;
    periodicity: number |null;
    refusal_reason: string | null;
    resource_id: number;
    start_date: string;
    status: number | null;
    booking_reason:string;

    periodicEndMoment: moment;
    beginning: moment;
    end: moment;
    startMoment: moment;
    endMoment: moment;
    resource: Resource;
    slots : Slots;
    constructor (id?) {
        if(id) this.id = id;
        this.beginning = this.startMoment = this.start_date ? moment.utc(this.start_date).tz(moment.tz.guess()) :  moment();
        this.end = this.endMoment = this.end_date?  moment.utc(this.end_date).tz(moment.tz.guess()): moment();
        this.resource = new Resource();
    }

    async save() {
        if(this.id) {
            this.update();
        }
        else {
            this.create();
        }
    }
    async sync() { //TODO (delete this ) old name 'retrieve'
        try {
            let { data } = await http.get('/rbs/booking/' + this.id);
            Mix.extend(this, data);
        } catch (e) {
            notify.error('');
        }
    };
    calendarUpdate () {
        if (this.beginning) {
            this.slots = [{
                start_date: this.beginning.unix(),
                end_date: this.end.unix()
            }];
        }
        if(this.id) {
            this.update()
        }
        else {
            this.create();
        }
    };

    async update () {
        try {
            let url = '/rbs/resource/' + this.resource.id + '/booking/' + this.id;
            url += this.is_periodic ? '/periodic' : '';
            let {data} = await http.put(url, this.toJSON());
            this.status = STATE_CREATED;
            return data;
        }catch (e) {
            notify.error('');
        }
    };
    async create () {
        try {
            let url = '/rbs/resource/' + this.resource.id + '/booking';
            url += this.is_periodic ? '/periodic' : '';
            let {data} = await http.put(url, this.toJSON());
            Mix.extend(data, this);
            this.resource.bookings.push(booking);
            var booking = this;
            //TODO Update Bookings
        }catch (e){
            notify.error('');
        }
    }
    validate () {
        this.status = STATE_VALIDATED;
        this.process({
            status:this.status
        });
    };


    refuse () {
        this.status = STATE_REFUSED;
        this.process( {
            status: this.status,
            refusal_reason: this.refusal_reason
        });

    };

    async process (json) {
        try{
            return await   http.put('/rbs/resource/' + this.resource.id + '/booking/' + this.id + '/process', json);
        }
        catch (e) {
            notify.error('');
        }
    };

    async delete (){
        try {
            return await http.delete('/rbs/resource/' + this.resource.id + '/booking/' + this.id + "/false");
        }
         catch (e){  notify.error(''); }
    };

    isSlot () { return this.parent_booking_id !== null };
    isPending () { return this.status === STATE_CREATED };
    isValidated () { return this.status === STATE_VALIDATED };
    isRefused () { return this.status === STATE_REFUSED };

    toJSON () {
        let json = {
            slots : this.slots
        };
        if (this.is_periodic === true) {

            json['periodicity'] = this.periodicity;
            json['iana'] =  moment.tz.guess();
            json['days'] = _.pluck(_.sortBy(this.periodDays, function(day){ return day.number; }), 'value');
            if (this.occurrences !== undefined && this.occurrences > 0) {
                json['occurrences'] = this.occurrences;
            }
            else {
                json['periodic_end_date'] = this.periodicEndMoment.utc().unix();
            }
        }

        if (_.isString(this.booking_reason)) {
            json['booking_reason'] = this.booking_reason;
        }
        return json;
    }
}

export class Bookings extends Selection<Booking> {
    constructor() {
        super([]);
    }

    async sync(): Promise<void> {
        {
            let projects = await http.get(``); // TODO List bookings
            this.all = Mix.castArrayAs(Booking, projects.data);

        }
    }
}