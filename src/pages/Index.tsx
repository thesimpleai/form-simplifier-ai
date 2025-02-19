import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { StepIndicator } from "@/components/StepIndicator";
import { QuestionReview } from "@/components/QuestionReview";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

const STEPS = ["Upload Form", "Upload References", "Review"];

type Question = {
  id: string;
  text: string;
  proposedAnswers: string[];
  status: "no_match" | "conflict" | "resolved";
};

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formFile, setFormFile] = useState<File[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleNext = async () => {
    if (currentStep === 0) {
      if (formFile.length === 0) {
        toast({
          title: "No form selected",
          description: "Please upload an empty form to analyze",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      try {
        const formData = new FormData();
        formFile.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('mode', 'analyze');

        const { data: processingResult } = await supabase.functions.invoke('process-documents', {
          body: formData,
        });

        if (processingResult?.data && Array.isArray(processingResult.data)) {
          const extractedQuestions = processingResult.data.map((q: any) => ({
            id: q.id,
            text: q.text,
            proposedAnswers: [],
            status: "no_match" as const,
          }));
          setQuestions(extractedQuestions);
          
          toast({
            title: "Form analyzed",
            description: `Successfully extracted ${extractedQuestions.length} questions from the form`,
          });
        }
      } catch (error) {
        console.error('Error analyzing form:', error);
        toast({
          title: "Error analyzing form",
          description: "There was an error analyzing your form. Please try again.",
          variant: "destructive",
        });
        return;
      } finally {
        setIsProcessing(false);
      }
    } else if (currentStep === 1) {
      if (referenceFiles.length === 0) {
        toast({
          title: "No files selected",
          description: "Please upload at least one reference document",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      try {
        const formData = new FormData();
        referenceFiles.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('mode', 'extract');

        const { data: processingResult } = await supabase.functions.invoke('process-documents', {
          body: formData,
        });

        if (processingResult?.data) {
          const extractedData = processingResult.data;
          
          setQuestions(prev => prev.map(question => {
            const lowercaseText = question.text.toLowerCase();
            let answer = '';
            
            if (lowercaseText.includes('name')) {
              answer = extractedData.fullName || extractedData.name || '';
            } else if (lowercaseText.includes('birth') || lowercaseText.includes('dob')) {
              answer = extractedData.dateOfBirth || extractedData.dob || '';
            } else if (lowercaseText.includes('address')) {
              answer = extractedData.address || '';
            } else if (lowercaseText.includes('phone')) {
              answer = extractedData.phone || extractedData.phoneNumber || '';
            } else if (lowercaseText.includes('email')) {
              answer = extractedData.email || '';
            }

            return {
              ...question,
              proposedAnswers: answer ? [answer] : [],
              status: answer ? "resolved" : "no_match",
            };
          }));

          toast({
            title: "Documents processed",
            description: "Information has been extracted from your documents",
          });
        }
      } catch (error) {
        console.error('Error processing documents:', error);
        toast({
          title: "Error processing documents",
          description: "There was an error processing your documents. Please try again.",
          variant: "destructive",
        });
        return;
      } finally {
        setIsProcessing(false);
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleAnswerUpdate = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      console.log("Updated answers:", newAnswers);
      return newAnswers;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGenerateFinalForm = async () => {
    if (questions.length === 0) {
      toast({
        title: "No questions available",
        description: "Please make sure you have uploaded and analyzed a form first.",
        variant: "destructive",
      });
      return;
    }

    const answeredQuestions = questions.filter(
      question => selectedAnswers[question.id]?.trim()
    );

    if (answeredQuestions.length < questions.length) {
      toast({
        title: "Missing answers",
        description: "Please provide answers for all questions before generating the final form",
        variant: "destructive",
      });
      return;
    }

    const formattedAnswers = questions
      .map(q => `${q.text}: ${selectedAnswers[q.id]}`)
      .join('\n');

    toast({
      title: "Form Generated",
      description: "Your form has been generated with the following answers:\n" + formattedAnswers,
    });

    console.log("Generated form with answers:", selectedAnswers);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Form-Filling AI</h1>
            <p className="text-gray-600">
              Easily fill your forms with data from your reference documents
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>

        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <main className="bg-white rounded-xl shadow-sm p-8 mb-8">
          {currentStep === 0 && (
            <FileUpload
              title="Upload Empty Form"
              description="Upload the form you want to fill (PDF format)"
              onFilesSelected={setFormFile}
              maxFiles={1}
            />
          )}

          {currentStep === 1 && (
            <FileUpload
              title="Upload Reference Documents"
              description="Upload your reference documents (PDF, DOC, DOCX, or TXT)"
              onFilesSelected={setReferenceFiles}
              maxFiles={5}
            />
          )}

          {currentStep === 2 && (
            <QuestionReview
              questions={questions}
              onAnswerUpdate={handleAnswerUpdate}
            />
          )}
        </main>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button 
              onClick={handleNext}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                'Next'
              )}
            </Button>
          ) : (
            <Button onClick={handleGenerateFinalForm}>
              Generate Final Form
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
