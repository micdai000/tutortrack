import { useEffect, useState } from "react";

import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  reorderQuestions,
  updateQuestion,
} from "../services/renderAccountService";
import type {
  RenderQuestion,
  RenderQuestionInput,
  RenderQuestionUpdate,
} from "../types/renderAccount";
import { getErrorMessage } from "../utils/getErrorMessage";

type UseRenderQuestionsResult = {
  questions: RenderQuestion[];
  loading: boolean;
  error: string | null;
  create: (input: RenderQuestionInput) => Promise<RenderQuestion>;
  update: (
    questionId: string,
    updates: RenderQuestionUpdate
  ) => Promise<RenderQuestion>;
  remove: (questionId: string) => Promise<void>;
  reorder: (questionIds: string[]) => Promise<void>;
  refresh: () => Promise<void>;
};

/** Loads and mutates questions for a Render an Account. */
export function useRenderQuestions(
  renderAccountId: string | undefined
): UseRenderQuestionsResult {
  const [questions, setQuestions] = useState<RenderQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    if (!renderAccountId) {
      setQuestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getQuestions(renderAccountId);
      setQuestions(data);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load questions."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [renderAccountId]);

  async function create(input: RenderQuestionInput): Promise<RenderQuestion> {
    if (!renderAccountId) {
      throw new Error("Render an Account not found.");
    }

    const created = await createQuestion(renderAccountId, input);
    setQuestions((current) => [...current, created]);
    return created;
  }

  async function update(
    questionId: string,
    updates: RenderQuestionUpdate
  ): Promise<RenderQuestion> {
    const updated = await updateQuestion(questionId, updates);
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? updated : question
      )
    );
    return updated;
  }

  async function remove(questionId: string) {
    await deleteQuestion(questionId);
    setQuestions((current) =>
      current.filter((question) => question.id !== questionId)
    );
  }

  async function reorder(questionIds: string[]) {
    if (!renderAccountId) {
      throw new Error("Render an Account not found.");
    }

    const reordered = await reorderQuestions(renderAccountId, questionIds);
    setQuestions(reordered);
  }

  return {
    questions,
    loading,
    error,
    create,
    update,
    remove,
    reorder,
    refresh,
  };
}
