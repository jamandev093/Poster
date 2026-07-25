import {
  ImageResponse,
} from "next/og";

export const alt =
  "Poster — Discover better knowledge from sources you can trust";

export const size = {
  width:
    1200,
  height:
    630,
};

export const contentType =
  "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display:
            "flex",

          width:
            "100%",
          height:
            "100%",

          flexDirection:
            "column",

          justifyContent:
            "space-between",

          padding:
            "72px 78px",

          background:
            "linear-gradient(135deg, #eef2fb 0%, #f8faff 58%, #dfe7f8 100%)",

          color:
            "#0f172a",

          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                "18px",
            }}
          >
            <div
              style={{
                display:
                  "flex",

                width:
                  "58px",
                height:
                  "58px",

                alignItems:
                  "center",
                justifyContent:
                  "center",

                borderRadius:
                  "14px",

                background:
                  "#5b86e5",

                color:
                  "#ffffff",

                fontSize:
                  "28px",
                fontWeight:
                  700,
              }}
            >
              P
            </div>

            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",
              }}
            >
              <span
                style={{
                  fontSize:
                    "28px",
                  fontWeight:
                    700,

                  letterSpacing:
                    "-0.02em",
                }}
              >
                Poster
              </span>

              <span
                style={{
                  marginTop:
                    "3px",

                  color:
                    "#64748b",

                  fontSize:
                    "17px",
                }}
              >
                getpostar.com
              </span>
            </div>
          </div>

          <span
            style={{
              color:
                "#315fbd",

              fontSize:
                "17px",
              fontWeight:
                700,

              letterSpacing:
                "0.08em",

              textTransform:
                "uppercase",
            }}
          >
            Knowledge discovery
          </span>
        </div>

        <div
          style={{
            display:
              "flex",

            maxWidth:
              "970px",

            flexDirection:
              "column",
          }}
        >
          <span
            style={{
              color:
                "#315fbd",

              fontSize:
                "18px",
              fontWeight:
                700,

              letterSpacing:
                "0.08em",

              textTransform:
                "uppercase",
            }}
          >
            Discover knowledge that matters
          </span>

          <div
            style={{
              display:
                "flex",

              marginTop:
                "22px",

              flexDirection:
                "column",

              fontSize:
                "68px",
              lineHeight:
                1.04,
              fontWeight:
                700,

              letterSpacing:
                "-0.045em",
            }}
          >
            <span>
              Discover better knowledge.
            </span>

            <span>
              From sources you can trust.
            </span>
          </div>

          <p
            style={{
              maxWidth:
                "900px",

              margin:
                "26px 0 0",

              color:
                "#475569",

              fontSize:
                "25px",
              lineHeight:
                1.45,
            }}
          >
            Find useful, relevant information and continue
            directly to the original publisher.
          </p>
        </div>

        <div
          style={{
            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            color:
              "#64748b",

            fontSize:
              "17px",
          }}
        >
          <span>
            Discover · Personalize · Go to the source
          </span>

          <span>
            getpostar.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}