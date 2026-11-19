import csv
import importlib.util
import io
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / "liverooms/infra/vps/calendar_feed.py"
spec = importlib.util.spec_from_file_location("calendar_feed_tested", MODULE)
feed_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(feed_module)


def fixture(rows):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([""] * 10)
    writer.writerow(feed_module.EVENT_HEADERS)
    writer.writerows(rows)
    return output.getvalue().encode()


def event(**changes):
    value = {"id": "event_1", "date": "2026-11-21", "startTime": "15:00", "endTime": "18:00", "kind": "talk", "title": "Точная тема", "description": "Описание", "location": "Москва", "url": "https://t.me/mosarmclub", "image": "https://example.com/picture.png", "status": "Опубликовано", "timezone": "Europe/Moscow"}
    value.update(changes)
    return value


class CalendarTests(unittest.TestCase):
    def test_csv_second_tab_headers_and_quoted_values(self):
        raw = fixture([["21.11.26", "15:00–18:00", "Разговорный клуб", "Текст, с запятой\nи новой строкой", "Точная тема", "Москва", "https://t.me/mosarmclub", "Опубликовано", "", "event_1"]])
        rows = feed_module.public_events(feed_module.events_from_csv(raw))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["date"], "2026-11-21")
        self.assertEqual(rows[0]["kind"], "talk")
        self.assertEqual(rows[0]["description"], "Текст, с запятой\nи новой строкой")
        self.assertEqual(rows[0]["startTime"], "15:00")
        self.assertEqual(rows[0]["endTime"], "18:00")
        self.assertNotIn("status", rows[0])

    def test_only_published_complete_real_dates_and_safe_links(self):
        rows = [event(), event(id="draft", status="Черновик"), event(id="cancel", status="Отменено"), event(id="missing", title=""), event(id="bad_date", date="2026-02-30"), event(id="bad_time", startTime="25:00"), event(id="backwards", endTime="14:00"), event(id="zone", timezone="UTC")]
        self.assertEqual([row["id"] for row in feed_module.public_events(rows)], ["event_1"])
        safe = feed_module.public_events([event(url="javascript:alert(1)", image="https://user:password@example.com/x")])[0]
        self.assertEqual(safe["url"], "")
        self.assertEqual(safe["image"], "")
        self.assertEqual(feed_module.public_events([event(image="/images/event-talk.png")])[0]["image"], "/images/event-talk.png")
        self.assertEqual(feed_module.public_events([event(title="Т" * 160, kind="К" * 80, id="a" * 80)])[0]["title"], "Т" * 160)

    def test_unknown_schema_duplicates_and_login_html_fail_closed(self):
        for raw in [b"<html>Sign in</html>", fixture([]).replace("Время".encode(), "Другая колонка".encode()), b"x" * 512_001]:
            with self.assertRaises(feed_module.CalendarFeedError):
                feed_module.events_from_csv(raw)
        with self.assertRaises(feed_module.CalendarFeedError):
            feed_module.public_events([event(), event()])

    def test_cache_month_filter_marker_and_bounded_failed_retry(self):
        now, calls = [0.0], []
        raw = fixture([["2026-11-21", "9:00-12:00", "other", "", "Событие", "", "", "Опубликовано", "", "evt1"]])
        def transport(url):
            self.assertEqual(url, feed_module.EVENTS_CSV_URL)
            self.assertIn("gid=711315998", url)
            calls.append(url)
            return raw
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / "revision"
            feed = feed_module.CalendarFeed({"VERNATUN_EVENTS_CACHE_REVISION_PATH": str(marker)}, transport, lambda: now[0])
            first = feed.get("2026-11")
            self.assertEqual(first["events"][0]["startTime"], "09:00")
            self.assertEqual(feed.get("2026-12")["events"], [])
            self.assertEqual(len(calls), 1)
            first["events"][0]["title"] = "modified caller copy"
            self.assertEqual(feed.get()["events"][0]["title"], "Событие")
            marker.write_text("new revision")
            feed.get()
            self.assertEqual(len(calls), 2)
            now[0] = 61.0
            feed.get()
            self.assertEqual(len(calls), 3)
            with self.assertRaises(feed_module.CalendarFeedError):
                feed.get("2026-13")
            self.assertEqual(len(calls), 3)
        failed = []
        def broken(url):
            failed.append(url)
            raise RuntimeError("PRIVATE URL/TOKEN MUST NOT LEAK")
        feed = feed_module.CalendarFeed({}, broken, lambda: now[0])
        for _ in range(3):
            with self.assertRaisesRegex(feed_module.CalendarFeedError, "^calendar_unavailable$"):
                feed.get()
        self.assertEqual(len(failed), 1)


if __name__ == "__main__":
    unittest.main()
