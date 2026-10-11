"use client";

import type { FormEvent } from "react";
import { dances, parseCourseKey, type CourseKey } from "@/content/catalog";
import { format } from "@/i18n/format";
import { updateDemoState, useDemoState } from "@/lib/demo-store";
import { localizedValidation } from "@/lib/validation";
import { useI18n } from "./i18n-provider";
import { Modal } from "./modal";
import { useToast } from "./toast";

const TIME_SLOTS = ["10:00", "14:00", "18:00", "19:00"];

function tomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, "0")).join("-");
}

type BookingDialogProps = {
  open: boolean;
  onClose: () => void;
  /** With a course, this requests a private lesson; without one, it is a general message. */
  course?: CourseKey;
};

export function BookingDialog({ open, onClose, course }: BookingDialogProps) {
  const { dict } = useI18n();
  const { user } = useDemoState();
  const toast = useToast();
  const parsed = course ? parseCourseKey(course) : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const contact = { name: data.name, email: data.email, message: data.message };
    if (course) {
      updateDemoState((state) => ({
        ...state,
        bookings: [...state.bookings, { course, date: data.date, time: data.time, ...contact }],
      }));
      toast(dict.booking.savedLesson);
    } else {
      updateDemoState((state) => ({ ...state, feedback: contact }));
      toast(dict.booking.savedContact);
    }
    onClose();
  }

  const minDate = open && course ? tomorrow() : undefined;

  return (
    <Modal open={open} onClose={onClose} label={dict.booking.dialogLabel}>
      <div className="eyebrow">{dict.booking.eyebrow}</div>
      <h2>{course ? dict.booking.titleLesson : dict.booking.titleContact}</h2>
      <p className="sub">
        {parsed ? format(dict.booking.subLesson, { dance: dances[parsed.danceId].name }) : dict.booking.subContact}
      </p>
      <form className="formStack" onSubmit={submit} {...localizedValidation(dict)}>
        <label>
          {dict.common.name}
          <input name="name" required maxLength={60} defaultValue={user?.name ?? ""} />
        </label>
        <label>
          {dict.common.email}
          <input name="email" type="email" required defaultValue={user?.email ?? ""} />
        </label>
        {course && (
          <div className="fieldPair">
            <label>
              {dict.booking.date}
              <input name="date" type="date" required min={minDate} defaultValue={minDate} />
            </label>
            <label>
              {dict.booking.time}
              <select name="time">
                {TIME_SLOTS.map((slot) => (
                  <option key={slot}>{slot}</option>
                ))}
              </select>
            </label>
          </div>
        )}
        <label>
          {dict.booking.message}
          <textarea name="message" placeholder={dict.booking.messagePlaceholder} required={!course} />
        </label>
        <button className="btn">{course ? dict.booking.submitLesson : dict.booking.submitContact}</button>
        <p className="fine">{dict.booking.fine}</p>
      </form>
    </Modal>
  );
}
