import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchEventById } from "../api/events";
import { toast } from "react-toastify";

// Helper to format time to 12-hour with AM/PM
function formatTimeTo12Hour(time24) {
  if (!time24) return "";
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

// Memoized Event Image Component for better performance
const EventImage = memo(({ imageUrl, eventName, category }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <div className="relative h-64 md:h-80">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
      {imageError ? (
        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <svg
              className="w-16 h-16 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Image not available</p>
          </div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={eventName}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          width={800}
          height={400}
        />
      )}
      <div className="absolute top-4 right-4">
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          {category}
        </span>
      </div>
    </div>
  );
});

EventImage.displayName = "EventImage";

// Memoized Pricing Card Component
const PricingCard = memo(
  ({ title, value, bgColor, textColor, subtitle, additionalInfo }) => (
    <div className={`text-center p-4 ${bgColor} rounded-lg`}>
      <div className={`text-3xl font-bold ${textColor} mb-2`}>{value}</div>
      <div className="text-slate-600">{subtitle}</div>
      {additionalInfo && (
        <div className="text-xs text-orange-600 mt-1">{additionalInfo}</div>
      )}
    </div>
  )
);

PricingCard.displayName = "PricingCard";

// Memoized Dynamic Pricing Rules Component
const DynamicPricingRules = memo(({ rules }) => {
  if (!rules || rules.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-orange-50 rounded-lg">
      <h3 className="font-semibold text-orange-800 mb-2">
        Dynamic Pricing Rules
      </h3>
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div key={index} className="text-sm text-orange-700">
            When {rule.threshold} or fewer seats remain: +{rule.percentage}%
            price increase
          </div>
        ))}
      </div>
    </div>
  );
});

DynamicPricingRules.displayName = "DynamicPricingRules";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true);
        const data = await fetchEventById(eventId);
        setEvent(data);
      } catch (err) {
        setError(err.message || "Failed to load event details");
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  // Memoized event calculations to prevent recalculation on every render
  const eventCalculations = useMemo(() => {
    if (!event) return null;

    const availableSeats = event.totalSeats - event.soldTickets;
    const isSoldOut = event.soldTickets >= event.totalSeats;
    const currentPrice =
      typeof event.currentTicketPrice === "number"
        ? event.currentTicketPrice
        : typeof event.ticketPrice === "number"
        ? event.ticketPrice
        : null;
    const formattedTime = formatTimeTo12Hour(event.time);

    return {
      availableSeats,
      isSoldOut,
      currentPrice,
      formattedTime,
    };
  }, [event]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleBookNow = useCallback(() => {
    navigate(`/booking/${eventId}`);
  }, [navigate, eventId]);

  const handleBackToEvents = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  // Memoized pricing cards data
  const pricingCardsData = useMemo(() => {
    if (!eventCalculations) return [];

    return [
      {
        title: "Current Price",
        value: eventCalculations.currentPrice
          ? `$${eventCalculations.currentPrice}`
          : "N/A",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        subtitle: "Current Price",
        additionalInfo: event.dynamicPricing?.enabled
          ? "Dynamic pricing active"
          : null,
      },
      {
        title: "Available Seats",
        value: eventCalculations.availableSeats,
        bgColor: "bg-green-50",
        textColor: "text-green-600",
        subtitle: "Available Seats",
      },
      {
        title: "Tickets Sold",
        value: event.soldTickets,
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
        subtitle: "Tickets Sold",
      },
    ];
  }, [eventCalculations, event.soldTickets, event.dynamicPricing?.enabled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Event Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            {error || "The event you're looking for doesn't exist."}
          </p>
          <button
            onClick={handleBackToEvents}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={handleBackToEvents}
          className="flex items-center text-blue-600 underline cursor-pointer hover:text-blue-800 mb-6 transition-colors font-medium"
          style={{ background: "none", border: "none", padding: 0 }}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Events
        </button>

        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <EventImage
              imageUrl={event.imageUrl}
              eventName={event.name}
              category={event.category}
            />

            <div className="p-6 md:p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
                {event.name}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="font-medium">
                      {event.date} at {eventCalculations?.formattedTime}
                    </span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="font-medium">{event.venue}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">
                      {event.totalSeats} Total Seats
                    </span>
                  </div>

                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">
                      {eventCalculations?.availableSeats} Available Seats
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Description */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              About This Event
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {event.description}
            </p>
          </div>

          {/* Pricing Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Ticket Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingCardsData.map((card, index) => (
                <PricingCard key={index} {...card} />
              ))}
            </div>

            <DynamicPricingRules rules={event.dynamicPricing?.rules} />
          </div>

          {/* Booking Action */}
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Ready to Book?
              </h2>
              <p className="text-slate-600 mb-6">
                Select your preferred seat and complete your booking to secure
                your spot at this amazing event.
              </p>

              <button
                onClick={handleBookNow}
                disabled={eventCalculations?.isSoldOut}
                className={`px-8 py-4 rounded-lg text-lg font-semibold transition-colors ${
                  eventCalculations?.isSoldOut
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {eventCalculations?.isSoldOut ? "Sold Out" : "Book Now"}
              </button>

              {eventCalculations?.isSoldOut && (
                <p className="text-red-600 mt-2 text-sm">
                  This event is completely sold out
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
