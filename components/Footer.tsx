import Link from "next/link";
import { SITE } from "@/lib/config";
import { formatHour } from "@/lib/format";
import { CONTACT } from "@/lib/siteContent";

export default function Footer() {
  const hasContact = CONTACT.address || CONTACT.phone || CONTACT.instagram || CONTACT.mapUrl;
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <strong className="footer-brand">{SITE.name}</strong>
          <p>رزرو آنلاین سیستم‌های گیمینگ Standard و Pro</p>
        </div>
        <nav aria-label="پیوندهای پایین صفحه">
          <Link href="/">خانه</Link>
          <Link href="/about">درباره ما</Link>
          <Link href="/cafe">کافه</Link>
        </nav>
        <div>
          <p>
            ساعات رزرو آنلاین: {formatHour(SITE.openHour)} تا {formatHour(SITE.closeHour)}
          </p>
          {hasContact ? (
            <ul className="footer-contact">
              {CONTACT.address && <li>{CONTACT.address}</li>}
              {CONTACT.phone && (
                <li>
                  <a href={`tel:${CONTACT.phone}`} className="ltr">
                    {CONTACT.phone}
                  </a>
                </li>
              )}
              {CONTACT.instagram && (
                <li>
                  <a href={CONTACT.instagram} rel="noopener noreferrer" target="_blank">
                    اینستاگرام
                  </a>
                </li>
              )}
              {CONTACT.mapUrl && (
                <li>
                  <a href={CONTACT.mapUrl} rel="noopener noreferrer" target="_blank">
                    مسیریابی
                  </a>
                </li>
              )}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
