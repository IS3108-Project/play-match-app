// OnboardingPage.tsx
import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { authClient } from "@/lib/client-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, CheckCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/ThemeToggle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onboarding = (authClient as any).onboarding;

const SPORTS = [
  "Running",
  "Cycling",
  "Hiking",
  "Yoga",
  "Tennis",
  "Badminton",
  "Swimming",
  "Basketball",
];
const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const TIMES = ["Morning", "Afternoon", "Evening", "Weekends"] as const;
const AREAS = ["North", "South", "East", "West", "Central"] as const;

type Step =
  | "sportInterests"
  | "skillLevel"
  | "preferredTimes"
  | "preferredAreas";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const [currentStep, setCurrentStep] = useState<Step>("sportInterests");
  const [isLoading, setIsLoading] = useState(false);

  // Selections
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  if (isPending) {
    return (
      <div className="grid h-screen place-items-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Already completed onboarding? Go to home
  if (session.user?.shouldOnboard === false) {
    return <Navigate to="/" replace />;
  }

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      if (currentStep === "sportInterests") {
        await onboarding.step.sportInterests({
          sportInterests: selectedSports,
        });
        setCurrentStep("skillLevel");
      } else if (currentStep === "skillLevel") {
        await onboarding.step.skillLevel({ skillLevel: selectedSkill });
        setCurrentStep("preferredTimes");
      } else if (currentStep === "preferredTimes") {
        await onboarding.step.preferredTimes({ preferredTimes: selectedTimes });
        setCurrentStep("preferredAreas");
      } else if (currentStep === "preferredAreas") {
        await onboarding.step.preferredAreas({ preferredAreas: selectedAreas });
        navigate("/");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      if (currentStep === "preferredTimes") {
        await onboarding.skipStep.preferredTimes();
        setCurrentStep("preferredAreas");
      } else if (currentStep === "preferredAreas") {
        await onboarding.skipStep.preferredAreas();
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "skillLevel") {
      setCurrentStep("sportInterests");
    } else if (currentStep === "preferredTimes") {
      setCurrentStep("skillLevel");
    } else if (currentStep === "preferredAreas") {
      setCurrentStep("preferredTimes");
    }
  };

  const isNextDisabled = () => {
    if (currentStep === "sportInterests") return selectedSports.length === 0;
    if (currentStep === "skillLevel") return !selectedSkill;
    if (currentStep === "preferredTimes") return selectedTimes.length === 0;
    if (currentStep === "preferredAreas") return selectedAreas.length === 0;
    return false;
  };

  const isOptionalStep =
    currentStep === "preferredTimes" || currentStep === "preferredAreas";

  return (
    <div className="relative grid min-h-screen place-items-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl">
        {/* Left Panel - Primary Purple */}
        <div className="hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h1 className="mb-4 text-4xl font-bold">You're In!</h1>
            <p className="text-primary-foreground/70">
              Now let's tailor the experience
              to your interests so you find the right squad.
            </p>
          </div>

        </div>

        {/* Right Panel - Card */}
        <Card className="w-full rounded-none border-0 lg:w-1/2 lg:rounded-l-none lg:rounded-r-2xl">
          <CardContent className="flex min-h-[480px] flex-col justify-between p-8">
            <div>
              {/* Step: Sport Interests */}
              {currentStep === "sportInterests" && (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Your Interests</h2>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Select the activities you want to see on your feed.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {SPORTS.map((sport) => (
                      <button
                        key={sport}
                        onClick={() => toggleSport(sport)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                          selectedSports.includes(sport)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {sport}
                        {selectedSports.includes(sport) && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step: Skill Level */}
              {currentStep === "skillLevel" && (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <button
                      onClick={handleBack}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Your Skill Level</h2>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Help us match you with others at a similar level.
                  </p>
                  <div className="flex flex-col gap-3">
                    {SKILL_LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => setSelectedSkill(level)}
                        className={cn(
                          "rounded-lg border px-4 py-3 text-left text-sm capitalize transition-colors",
                          selectedSkill === level
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step: Preferred Times */}
              {currentStep === "preferredTimes" && (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <button
                      onClick={handleBack}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Preferred Times</h2>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground">
                    When do you usually work out? (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {TIMES.map((time) => (
                      <button
                        key={time}
                        onClick={() => toggleTime(time)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                          selectedTimes.includes(time)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {time}
                        {selectedTimes.includes(time) && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step: Preferred Areas */}
              {currentStep === "preferredAreas" && (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <button
                      onClick={handleBack}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Preferred Areas</h2>
                  </div>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Where in Singapore do you prefer? (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {AREAS.map((area) => (
                      <button
                        key={area}
                        onClick={() => toggleArea(area)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                          selectedAreas.includes(area)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        {area}
                        {selectedAreas.includes(area) && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 flex gap-3">
              {isOptionalStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleNext}
                disabled={isNextDisabled() || isLoading}
              >
                {currentStep === "preferredAreas"
                  ? "Start Exploring →"
                  : "Next →"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}