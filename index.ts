export type ErrorHandler = (error: any) => any;
export type Task<R, P> =
  | ((prevResult: P, ...args: any[]) => Promise<R>)
  | Promise<R>;

export type Queue<R, P> = {
  task: Task<R, P>;
  errorHandler: ErrorHandler | undefined;
};

export type ForeachArray<T, P> = ((prevResult: P) => T[]) | T[];

export type ForeachTask<R, T, P> = (
  item: T,
  prevResult: P,
  ...args: any[]
) => Promise<R>;

export type EndCallback<R, All> = (allResults: All) => R;

class Finalized<R> {
  #endPromise: Promise<R>;
  #defaultGuaranteedHandler: ErrorHandler | undefined;

  constructor(endPromise: Promise<R>, defaultGuaranteedHandler?: ErrorHandler) {
    this.#endPromise = endPromise;
    this.#defaultGuaranteedHandler = defaultGuaranteedHandler;
  }

  async guarantee(
    guaranteedErrorHandler: ErrorHandler | "DEFAULT"
  ): Promise<R> {
    try {
      return await this.#endPromise;
    } catch (error) {
      if (guaranteedErrorHandler === "DEFAULT") {
        if (!this.#defaultGuaranteedHandler)
          throw Error(
            `You seem to want to use the default error handler, but you haven't set a default error handler.`
          );
        guaranteedErrorHandler = this.#defaultGuaranteedHandler;
      }
      return guaranteedErrorHandler(error);
    }
  }
}

class SequentialRequest<Tasks extends any[] = []> {
  #queue: Queue<any, any>[] = [];
  #errorHandler: ErrorHandler | undefined;
  #defaultGuaranteedErrorHandler: ErrorHandler | undefined;
  #ended: boolean;

  constructor(defaultGuaranteedErrorHandler?: ErrorHandler) {
    this.#defaultGuaranteedErrorHandler = defaultGuaranteedErrorHandler;
  }

  next<R = any, P = Tasks extends [...infer _, infer Last] ? Last : any>(
    task: Task<R, P>
  ): SequentialRequest<[...Tasks, R]> {
    this.#queue.push({ task, errorHandler: undefined });
    return this as any as SequentialRequest<[...Tasks, R]>;
  }

  catch(errorHandler: ErrorHandler): this {
    this.#queue[this.#queue.length - 1].errorHandler = errorHandler;
    return this;
  }

  foreach<
    R = any,
    T = any,
    P = Tasks extends [...infer _, infer Last] ? Last : any
  >(
    items: ForeachArray<T, P>,
    task: ForeachTask<R, T, P>
  ): SequentialRequest<[...Tasks, R[]]> {
    return this.next(async (prevResult: P) => {
      const resolvedItems =
        typeof items === "function" ? items(prevResult) : items;
      const results: R[] = [];
      for (const item of resolvedItems) {
        results.push(await task(item, prevResult));
      }
      return results;
    }) as SequentialRequest<[...Tasks, R[]]>;
  }

  end<R = any, All = Tasks>(callback: EndCallback<R, All>): Finalized<R> {
    this.#ended = true;
    const endPromise = (async () => {
      const results: R[] = [];
      try {
        let prevResult: any = null;
        for (const { task, errorHandler } of this.#queue) {
          this.#errorHandler = errorHandler;
          if (typeof task === "function") {
            prevResult = await task(prevResult);
          } else {
            prevResult = await task;
          }
          results.push(prevResult);
        }
        return callback(results as All);
      } catch (error) {
        if (this.#errorHandler) {
          return callback(this.#errorHandler(error));
        }
        throw error;
      }
    })();

    return new Finalized<R>(endPromise, this.#defaultGuaranteedErrorHandler);
  }
}

export { SequentialRequest };
export default SequentialRequest;

const request = new SequentialRequest();
(async () => {
  const data = await request
    .next(Promise.resolve("Task 1"))
    .next((prevResult) => Promise.resolve("Task 2"))
    .catch((error) => ({
      message: "Task 2 Error Handler",
      error,
    }))
    .foreach([1, 2, 3], (item) => Promise.resolve(item))
    .end(([res1, res2, res3]) => ({
      result1: res1,
      result2: res2,
      result3: res3,
    }))
    .guarantee((error) => ({
      message: "Guaranteed Error Handler",
      error,
    }));
  console.log("All results:", data);
})();
